import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  const myUser = await prisma.user.create({
    data: {
      name: 'Matheus Serafim',
      email: 'matheus18serafim@gmail.com',
      avatarUrl: 'https://github.com/serafimmatheus.png',
      password: await hash('serafim123', 8),
    },
  })
  const user2 = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      password: await hash('12345678', 8),
    },
  })
  const user3 = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      password: await hash('12345678', 8),
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Rocketseat (Admin)',
      domain: 'rocketseat.com.br',
      slug: 'rocketseat-admin',
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: myUser.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: myUser.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: myUser.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user2.id,
            },

            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user3.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user3.id,
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: myUser.id,
              role: 'ADMIN',
            },
            {
              userId: user2.id,
              role: 'MEMBER',
            },
            {
              userId: user3.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Google (Member)',
      slug: 'google-member',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: myUser.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: myUser.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: myUser.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user2.id,
            },

            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user3.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user3.id,
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: myUser.id,
              role: 'MEMBER',
            },
            {
              userId: user2.id,
              role: 'ADMIN',
            },
            {
              userId: user3.id,
              role: 'MEMBER',
            },
          ],
        },
      },
    },
  })

  await prisma.organization.create({
    data: {
      name: 'Facebook (Billing)',
      slug: 'facebook-billing',
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: myUser.id,
      projects: {
        createMany: {
          data: [
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: myUser.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: myUser.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user2.id,
            },

            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user3.id,
            },
            {
              name: faker.lorem.words(5),
              slug: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              avatarUrl: faker.image.avatarGitHub(),
              ownerId: user3.id,
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: myUser.id,
              role: 'BILLING',
            },
            {
              userId: user2.id,
              role: 'MEMBER',
            },
            {
              userId: user3.id,
              role: 'ADMIN',
            },
          ],
        },
      },
    },
  })
}

seed()
  .then(() => {
    console.log('Seed complete')
  })
  .catch((e) => {
    console.log(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
