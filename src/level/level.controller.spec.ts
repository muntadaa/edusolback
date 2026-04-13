import { LevelController } from './level.controller';
import { LevelService } from './level.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('LevelController', () => {
  let controller: LevelController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new LevelController(service as unknown as LevelService);
  });

  it('should call service.create', async () => {
    const dto = { title: 'Level 1' } as any;
    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should forward queries to findAll', () => {
    const query = { search: 'level' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert id for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert id for update', async () => {
    const dto = { title: 'Updated' } as any;
    await controller.update('5', dto);

    expect(service.update).toHaveBeenCalledWith(5, dto);
  });

  it('should convert id for remove', async () => {
    await controller.remove('6');

    expect(service.remove).toHaveBeenCalledWith(6);
  });
});
