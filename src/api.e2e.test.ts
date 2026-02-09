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
});