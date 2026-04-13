import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequiredDocsService } from './required-docs.service';
import { RequiredDoc } from './entities/required-doc.entity';
import { Program } from '../programs/entities/program.entity';
import { Specialization } from '../specializations/entities/specialization.entity';
import { Level } from '../level/entities/level.entity';

const repo = () => ({});

describe('RequiredDocsService', () => {
  let service: RequiredDocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequiredDocsService,
        { provide: getRepositoryToken(RequiredDoc), useValue: repo() },
        { provide: getRepositoryToken(Program), useValue: repo() },
        { provide: getRepositoryToken(Specialization), useValue: repo() },
        { provide: getRepositoryToken(Level), useValue: repo() },
      ],
    }).compile();

    service = module.get<RequiredDocsService>(RequiredDocsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
