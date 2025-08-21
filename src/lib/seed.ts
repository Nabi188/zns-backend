import { prisma } from '@/lib/prisma'
import { hashPassword } from '../utils/hash'
import { Role } from '@/lib/generated/prisma'
import { Plan } from '@/modules/plans'
import { CreateUserInput } from '@/modules/auth'
import { generateApiKey } from '@/utils/hash'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

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
  const zaloOaLogs: string[] = []
  const tenantLogs: string[] = []

  log += '🚀 Bắt đầu seeding...\n\n'

  const users: (CreateUserInput & { isVerified: boolean })[] = [
    {
      fullName: 'Alice',
      email: 'alice@example.com',
      phone: '0977889999',
      password: 'password123',
      avatarUrl:
        'https://res.cloudinary.com/djlfx1adk/image/upload/v1704342262/rijmlovslazlhm9nu9jm.jpg',
      isVerified: false
    },
    {
      fullName: 'Bob',
      email: 'bob@example.com',
      phone: '0977881111',
      password: 'password123',
      avatarUrl:
        'https://res.cloudinary.com/djlfx1adk/image/upload/v1704342262/rijmlovslazlhm9nu9jm.jpg',
      isVerified: false
    },
    {
      fullName: 'Bin',
      email: 'hello@digii.vn',
      phone: '0962651808',
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
  const createdUsers: Record<string, any> = {}
  for (const user of users) {
    const hashedPassword = await hashPassword(user.password)
    const createdUser = await prisma.user.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        password: hashedPassword,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified
      }
    })
    createdUsers[user.fullName] = createdUser
    userLogs.push(
      `${user.fullName} (${user.email}) - verified: ${user.isVerified}`
    )
  }

  // Ghi log plans & users
  addSection('Plans đã tạo', planLogs)
  addSection('Users đã tạo', userLogs)

  // Lấy users
  const alice = createdUsers['Alice']
  const bob = createdUsers['Bob']
  const bin = createdUsers['Bin']

  // Tenant 1: Bin làm OWNER
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Digii Việt Nam',
      balance: 200000,
      members: {
        create: [
          { userId: bin.id, role: Role.OWNER }, // Bin là OWNER
          { userId: alice.id, role: Role.ADMIN }, // Alice làm ADMIN
          { userId: bob.id, role: Role.STAFF } // Bob làm STAFF
        ]
      }
    }
  })
  tenantLogs.push(`"${tenant1.name}": Bin (OWNER), Alice (ADMIN), Bob (STAFF)`)

  // Tenant 2: Alice làm OWNER
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Alice Corporation',
      balance: 150000,
      members: {
        create: [
          { userId: alice.id, role: Role.OWNER }, // Alice là OWNER
          { userId: bob.id, role: Role.STAFF }, // Bob làm STAFF
          { userId: bin.id, role: Role.FINANCE } // Bin làm FINANCE
        ]
      }
    }
  })
  tenantLogs.push(
    `"${tenant2.name}": Alice (OWNER), Bob (STAFF), Bin (FINANCE)`
  )

  // Tenant 3: Bob làm OWNER
  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Bob Enterprises',
      balance: 100000,
      members: {
        create: [
          { userId: bob.id, role: Role.OWNER }, // Bob là OWNER
          { userId: bin.id, role: Role.STAFF }, // Bin làm STAFF
          { userId: alice.id, role: Role.FINANCE } // Alice làm FINANCE
        ]
      }
    }
  })
  tenantLogs.push(
    `"${tenant3.name}": Bob (OWNER), Bin (STAFF), Alice (FINANCE)`
  )

  addSection('Tenants và Members đã tạo', tenantLogs)

  // Tạo API Keys cho từng tenant
  const tenants = [
    { tenant: tenant1, name: 'Digii' },
    { tenant: tenant2, name: 'Alice Corp' },
    { tenant: tenant3, name: 'Bob Ent' }
  ]

  for (const { tenant, name } of tenants) {
    // Lấy owner của tenant này
    const ownerMember = await prisma.tenantMember.findFirst({
      where: { tenantId: tenant.id, role: Role.OWNER },
      include: { user: true }
    })

    if (!ownerMember) continue

    // Tạo 2 API key cho mỗi tenant
    const apiKeyNames = [`${name} API Main`, `${name} API Sub`]
    for (const keyName of apiKeyNames) {
      const { prefix, keyHash, rawKey } = await generateApiKey()
      await prisma.apiKey.create({
        data: {
          tenantId: tenant.id,
          creatorId: ownerMember.userId,
          name: keyName,
          prefix,
          keyHash,
          isActive: true
        }
      })
      apiKeyLogs.push(
        `"${keyName}": prefix \`${prefix}\`, raw key \`${rawKey}\``
      )
    }
  }

  addSection('API Keys đã tạo', apiKeyLogs)

  // Lấy plan ENTERPRISE
  const enterprisePlan = await prisma.plan.findUnique({
    where: { name: 'ENTERPRISE' }
  })
  if (!enterprisePlan) throw new Error('❌ Không tìm thấy plan ENTERPRISE')

  // Tạo subscription cho từng tenant
  const now = new Date()
  for (const { tenant } of tenants) {
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: enterprisePlan.id,
        status: 'ACTIVE', // Enum đã chuyển thành UPPER_CASE
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      }
    })
  }
  log += `📅 Đã tạo ENTERPRISE subscriptions cho tất cả tenants (365 ngày)\n\n`

  // Tạo Zalo OA cho tenant đầu tiên (Digii)
  const oaList = [
    { oaIdZalo: '156766344333112212', oaName: 'Digii Việt Nam OA' },
    { oaIdZalo: '156766344333112213', oaName: 'Digii Support OA' }
  ]

  for (const oa of oaList) {
    await prisma.zaloOa.create({
      data: {
        tenantId: tenant1.id,
        oaIdZalo: oa.oaIdZalo,
        oaName: oa.oaName,
        accessToken: randomUUID(),
        refreshToken: randomUUID(),
        isActive: true
      }
    })
    zaloOaLogs.push(`"${oa.oaName}" cho ${tenant1.name}`)
  }

  addSection('Zalo OA đã tạo', zaloOaLogs)

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

  log += `✅ Hoàn thành seeding với 3 tenants và phân quyền đầy đủ (${formatVNDate()})`
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
