import { prisma } from '@/lib/prisma'
import { hashPassword } from '../utils/hash'
import { Role } from '@/lib/generated/prisma'
import { Plan } from '@/modules/plans'
import { CreateUserInput } from '@/modules/auth'
import { generateApiKey } from '@/utils/hash'
import fs from 'fs/promises'
import path from 'path'

let log = '# Seed result\n\n'

function addSection(title: string, lines: string[]) {
  log += `## ${title}\n`
  lines.forEach((line) => {
    log += `- ${line}\n`
  })
  log += '\n'
}

async function main() {
  const planLogs: string[] = []
  const userLogs: string[] = []
  const apiKeyLogs: string[] = []

  log += '🚀 Bắt đầu seeding...\n\n'

  const users: CreateUserInput[] = [
    {
      fullName: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      avatarUrl:
        'https://res.cloudinary.com/djlfx1adk/image/upload/v1704342262/rijmlovslazlhm9nu9jm.jpg',
      isVerified: false
    },
    {
      fullName: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
      avatarUrl:
        'https://res.cloudinary.com/djlfx1adk/image/upload/v1704342262/rijmlovslazlhm9nu9jm.jpg',
      isVerified: false
    },
    {
      fullName: 'Bin',
      email: 'hello@digii.vn',
      password: 'hello',
      avatarUrl:
        'https://res.cloudinary.com/djlfx1adk/image/upload/v1704342262/rijmlovslazlhm9nu9jm.jpg',
      isVerified: true
    }
  ]

  const plans: Plan[] = [
    {
      name: 'FREE',
      monthlyFee: 0,
      messageFee: 0,
      maxUsers: 1,
      isActive: true
    },
    {
      name: 'STARTER',
      monthlyFee: 299000,
      messageFee: 100,
      maxUsers: 1,
      isActive: true
    },
    {
      name: 'BUSINESS',
      monthlyFee: 499000,
      messageFee: 80,
      maxUsers: 3,
      isActive: true
    },
    {
      name: 'ENTERPRISE',
      monthlyFee: 799000,
      messageFee: 50,
      maxUsers: 5,
      isActive: true
    }
  ]

  // Xoá dữ liệu cũ
  await prisma.subscription.deleteMany()
  await prisma.tenantMember.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.user.deleteMany()
  await prisma.plan.deleteMany()
  log += '🗑️ Đã xoá toàn bộ dữ liệu cũ\n\n'

  // Tạo plans
  for (const plan of plans) {
    await prisma.plan.create({ data: plan })
    planLogs.push(`Plan "${plan.name}"`)
  }

  // Tạo users
  for (const user of users) {
    const hashedPassword = await hashPassword(user.password)
    await prisma.user.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        password: hashedPassword,
        avatarUrl: user.avatarUrl
      }
    })
    userLogs.push(
      `${user.fullName} (${user.email}) - avatar: ${user.avatarUrl}`
    )
  }

  // Ghi log plans & users
  addSection('Plans đã tạo', planLogs)
  addSection('Users đã tạo', userLogs)

  // Lấy user Bin
  const ownerUser = await prisma.user.findUnique({
    where: { email: 'hello@digii.vn' }
  })

  if (!ownerUser) throw new Error('❌ Không tìm thấy user Bin')

  // Tạo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Digii Việt Nam',
      ownerId: ownerUser.id,
      members: {
        create: {
          userId: ownerUser.id,
          role: Role.admin
        }
      }
    }
  })
  log += `🏢 Tenant "${tenant.name}" (ID: \`${tenant.id}\`) đã tạo và gán cho Bin làm owner.\n\n`

  // Tạo 2 API Key mẫu
  const apiKeyNames = ['API main', 'API sub']
  for (const name of apiKeyNames) {
    const { prefix, keyHash, rawKey } = await generateApiKey()
    await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        creatorId: ownerUser.id,
        name,
        prefix,
        keyHash,
        isActive: true
      }
    })
    apiKeyLogs.push(`"${name}": prefix \`${prefix}\`, raw key \`${rawKey}\` `)
  }

  addSection(`API Keys đã tạo cho tổ chức ${tenant.name}`, apiKeyLogs)

  const formatVNDate = (d = new Date()) =>
    new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d)

  log += `✅ Hoàn thành seeding (${formatVNDate()})`
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    const outPath = path.resolve(__dirname, 'seed-result.md')
    await fs.writeFile(outPath, log, 'utf8')
    console.log(`📄 Đã ghi kết quả ra file: ${outPath}`)
  })
