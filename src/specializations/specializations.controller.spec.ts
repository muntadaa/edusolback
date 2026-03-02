import { SpecializationsController } from './specializations.controller';
import { SpecializationsService } from './specializations.service';

const createServiceMock = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('SpecializationsController', () => {
  let controller: SpecializationsController;
  let service: ReturnType<typeof createServiceMock>;

  beforeEach(() => {
    service = createServiceMock();
    controller = new SpecializationsController(service as unknown as SpecializationsService);
  });

  it('should delegate create to service', async () => {
    const dto = { title: 'Spec' } as any;
    service.create.mockResolvedValue({ id: 1 });

    await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should delegate findAll to service', () => {
    const query = { search: 'spec' } as any;
    controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should convert params for findOne', () => {
    controller.findOne('4');

    expect(service.findOne).toHaveBeenCalledWith(4);
  });

  it('should convert params for update', async () => {
    const dto = { title: 'Updated' } as any;
    await controller.update('2', dto);

    expect(service.update).toHaveBeenCalledWith(2, dto);
  });

  it('should convert params for remove', async () => {
    await controller.remove('3');

    expect(service.remove).toHaveBeenCalledWith(3);
  });
});
