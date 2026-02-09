import { FastifyInstance } from 'fastify';
import { AppContainer } from 'src/container';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';

export async function webinarRoutes(
  fastify: FastifyInstance,
  container: AppContainer,
) {
  const changeSeatsUseCase = container.getChangeSeatsUseCase();
  const organizeWebinarsUseCase = container.getOrganizeWebinarsUseCase();

  fastify.post<{
    Body: { seats: string };
    Params: { id: string };
  }>('/webinars/:id/seats', {}, async (request, reply) => {
    const changeSeatsCommand = {
      seats: parseInt(request.body.seats, 10),
      webinarId: request.params.id,
      user: new User({
        id: 'test-user',
        email: 'test@test.com',
        password: 'fake',
      }),
    };

    try {
      await changeSeatsUseCase.execute(changeSeatsCommand);
      reply.status(200).send({ message: 'Seats updated' });
    } catch (err: any) {
      if (err instanceof WebinarNotFoundException) {
        return reply.status(404).send({ message: err.message });
      }
      if (err instanceof WebinarNotOrganizerException) {
        return reply.status(403).send({ message: err.message });
      }
      return reply.status(400).send({ message: err.message });
    }
  });

  fastify.post('/webinars', {}, async (request, reply) => {
    const body = request.body as any;
    try {
      const result = await organizeWebinarsUseCase.execute({
        userId: 'test-user', 
        title: body.title,
        seats: parseInt(body.seats, 10),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      });
      return reply.status(201).send({ id: result.id });
    } catch (err: any) {
      return reply.status(400).send({ message: err.message });
    }
  });
}