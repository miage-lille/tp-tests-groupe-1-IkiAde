import supertest from 'supertest';
import { TestServerFixture } from 'src/tests/fixtures';

describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  }, 90000);

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  describe('POST /webinars/:id/seats', () => {
    it('should update webinar seats successfully (Happy Path)', async () => {
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      await prisma.webinar.create({
        data: {
          id: 'test-webinar',
          title: 'Webinar Test',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'test-user',
        },
      });

      const response = await supertest(server)
        .post('/webinars/test-webinar/seats')
        .send({ seats: 30 })
        .expect(200);

      expect(response.body).toEqual({ message: 'Seats updated' });

      const updatedWebinar = await prisma.webinar.findUnique({
        where: { id: 'test-webinar' },
      });
      expect(updatedWebinar?.seats).toBe(30);
    });

    it('should return 404 if webinar does not exist', async () => {
      const server = fixture.getServer();

      const response = await supertest(server)
        .post('/webinars/unknown-id/seats')
        .send({ seats: 30 })
        .expect(404);

      expect(response.body.message).toBe('Webinar not found');
    });

    it('should return 403 if user is not the organizer', async () => {
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      await prisma.webinar.create({
        data: {
          id: 'other-webinar',
          title: 'Other Webinar',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'real-organizer-id',
        },
      });

      await supertest(server)
        .post('/webinars/other-webinar/seats')
        .send({ seats: 30 })
        .expect(403);
    });
  });

  describe('POST /webinars', () => {
    it('should organize a webinar successfully', async () => {
      const server = fixture.getServer();
      const prisma = fixture.getPrismaClient();

      const payload = {
        title: 'New API Webinar',
        seats: 100,
        startDate: new Date('2027-01-01T10:00:00Z').toISOString(),
        endDate: new Date('2027-01-01T10:00:00Z').toISOString(),
      };

      const response = await supertest(server).post('/webinars').send(payload);
      if (response.status !== 201) {
        console.log('Erreur reçue:', response.body); // Cela vous dira quel Use Case a bloqué
      }
      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('id');

      const createdWebinar = await prisma.webinar.findUnique({
        where: { id: response.body.id },
      });

      expect(createdWebinar?.title).toBe('New API Webinar');
      expect(createdWebinar?.seats).toBe(100);
    });

    it('should return 400 if webinar dates are too soon', async () => {
      const server = fixture.getServer();

      const payload = {
        title: 'Too Soon Webinar',
        seats: 50,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      const response = await supertest(server)
        .post('/webinars')
        .send(payload)
        .expect(400);

      expect(response.body.message).toContain('at least 3 days in advance');
    });
  });
});
