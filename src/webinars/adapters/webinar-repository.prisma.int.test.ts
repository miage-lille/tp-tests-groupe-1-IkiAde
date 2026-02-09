import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { promisify } from 'util';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository Integration Test', () => {
  let container: StartedPostgreSqlContainer;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .withExposedPorts(5432)
      .start();

    const dbUrl = container.getConnectionUri();
    prismaClient = new PrismaClient({
      datasources: { db: { url: dbUrl } },
    });

    await asyncExec(`npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: dbUrl },
    });
    return prismaClient.$connect();
  }, 90000); 

  afterAll(async () => {
    await container.stop({ timeout: 1000 });
    return prismaClient.$disconnect();
  });

  beforeEach(async () => {
    repository = new PrismaWebinarRepository(prismaClient);
    await prismaClient.webinar.deleteMany();
  });

  describe('Scenario : repository.create', () => {
    it('should create a webinar in the real database', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Webinar title',
        startDate: new Date('2025-01-01T10:00:00Z'),
        endDate: new Date('2025-01-01T11:00:00Z'),
        seats: 100,
      });

      await repository.create(webinar);

      const savedWebinar = await prismaClient.webinar.findUnique({
        where: { id: 'webinar-id' },
      });
      expect(savedWebinar).toMatchObject({
        id: 'webinar-id',
        seats: 100,
      });
    });
  });

  describe('Scenario : repository.findById', () => {
    it('should find a webinar by its id', async () => {
      await prismaClient.webinar.create({
        data: {
          id: 'find-me',
          organizerId: 'org-id',
          title: 'Found',
          startDate: new Date(),
          endDate: new Date(),
          seats: 50,
        },
      });

      const result = await repository.findById('find-me');
      expect(result?.props.id).toBe('find-me');
    });
  });

  describe('Scenario : repository.update', () => {
    it('should update an existing webinar', async () => {
      const webinar = new Webinar({
        id: 'update-me',
        organizerId: 'org-id',
        title: 'Initial Title',
        startDate: new Date(),
        endDate: new Date(),
        seats: 100,
      });
      await repository.create(webinar);

      webinar.update({ seats: 250 });
      await repository.update(webinar);

      const updated = await prismaClient.webinar.findUnique({ where: { id: 'update-me' } });
      expect(updated?.seats).toBe(250);
    });
  });
});