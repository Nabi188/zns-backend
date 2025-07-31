// prisma/seed.ts
import { prisma } from '@/lib/prisma'
import { hashPassword } from '../src/utils/hash'

async function main() {
  console.log('Start seeding...')

  const users = [
    {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123'
    },
    {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123'
    },
    {
      name: 'Bin',
      email: 'hello@digii.vn',
      password: 'hello'
    }
  ]

  // Xóa dữ liệu cũ trước khi seed (Tùy chọn)
  await prisma.user.deleteMany()

  for (const user of users) {
    const hashedPassword = await hashPassword(user.password)
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword
      }
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
