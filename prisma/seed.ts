// prisma/seed.ts
import { prisma } from '@/lib/prisma'
import { hashPassword } from '../src/utils/hash'
import { Role } from '@/lib/generated/prisma'
import { Plan } from '@/modules/plans'
import { CreateUserInput } from '@/modules/auth'
import { generateApiKey } from '@/utils/hash'

async function main() {
  console.log('Start seeding...')

  const users: CreateUserInput[] = [
    {
      fullName: 'Alice',
      email: 'alice@example.com',
      password: 'password123'
    },
    {
      fullName: 'Bob',
      email: 'bob@example.com',
      password: 'password123'
    },
    {
      fullName: 'Bin',
      email: 'hello@digii.vn',
      password: 'hello'
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

  // Tạo plans
  for (const plan of plans) {
    await prisma.plan.create({ data: plan })
  }

  // Tạo users
  for (const user of users) {
    const hashedPassword = await hashPassword(user.password)
    await prisma.user.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        password: hashedPassword
      }
    })
  }

  // Lấy user Bin
  const ownerUser = await prisma.user.findUnique({
    where: { email: 'hello@digii.vn' }
  })

  if (!ownerUser) throw new Error('Không tìm thấy user Bin')

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
  console.log(
    `✅ Tenant "${tenant.name}" (tenant ID: ${tenant.id}) đã tạo và gán cho Bin làm owner.`
  )

  // Tạo 2 API Key mẫu
  const apiKeyNames = ['API main', 'API sub']
  for (const name of apiKeyNames) {
    const { prefix, keyHash, rawKey } = await generateApiKey()
    await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        name,
        prefix,
        keyHash,
        isActive: true
      }
    })
    console.log(
      `🔑 API key "${name}" created: prefix:${prefix} - ${rawKey} (⚠️ chỉ hiển thị 1 lần thôi)`
    )
  }

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
