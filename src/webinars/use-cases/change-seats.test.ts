import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { testUser } from 'src/users/tests/user-seeds';
import { ChangeSeats } from 'src/webinars/use-cases/change-seats';

describe('Feature : Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  // --- Fixtures ---
  async function whenUserChangeSeatsWith(payload: any) {
    return useCase.execute(payload);
  }

  async function thenUpdatedWebinarSeatsShouldBe(seats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(seats);
  }

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }

  // --- Scénarios ---
  describe('Scenario: Happy path', () => {
    it('should change the number of seats for a webinar', async () => {
      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: 200,
      };

      await whenUserChangeSeatsWith(payload);
      await thenUpdatedWebinarSeatsShouldBe(200);
    });
  });

  describe('Scenario: webinar does not exist', () => {
    it('should fail', async () => {
      const payload = {
        user: testUser.alice,
        webinarId: 'non-existent-id',
        seats: 200,
      };

      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow('Webinar not found');
    });
  });

  describe('Scenario: user is not the organizer', () => {
    it('should fail', async () => {
      const payload = {
        user: testUser.bob,
        webinarId: 'webinar-id',
        seats: 200,
      };

      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow('User is not allowed to update this webinar');
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to an inferior number', () => {
    it('should fail', async () => {
      const payload = {
        user: testUser.alice,
        webinarId: 'webinar-id',
        seats: 50,
      };

      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow('You cannot reduce the number of seats');
      expectWebinarToRemainUnchanged();
    });
  });
});