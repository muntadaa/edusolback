import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Company created successfully. This endpoint is public and does not require authentication. Supports logo file upload (JPEG, PNG, GIF, WebP, max 2MB).' })
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Allow unknown properties for multipart/form-data
    transform: true 
  }))
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          // For creation, we need to create a temporary directory or use a default
          // Since we don't have companyId yet, we'll use a temp location and move it after creation
          const uploadPath = path.join(process.cwd(), 'uploads', 'temp', 'company');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        return cb(null, false);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Handle file upload for logo
    if (file) {
      // Store in temp location first, will be moved after company creation
      const tempPath = file.path;
      try {
        const company = await this.companyService.create(createCompanyDto);
        
        // Move file to company-specific directory
        const companyDir = path.join(process.cwd(), 'uploads', `${company.id}`, 'company');
        if (!fs.existsSync(companyDir)) {
          fs.mkdirSync(companyDir, { recursive: true });
        }
        
        const finalPath = path.join(companyDir, path.basename(tempPath));
        fs.renameSync(tempPath, finalPath);
        
        // Update company with logo path
        const relative = path.posix.join('uploads', `${company.id}`, 'company', path.basename(finalPath));
        company.logo = `/${relative.replace(/\\/g, '/')}`;
        return await this.companyService.update(company.id, { logo: company.logo });
      } catch (error) {
        // Clean up temp file if company creation fails
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        throw error;
      }
    }
    
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'List companies with pagination metadata.' })
  findAll(@Query() query: CompanyQueryDto) {
    return this.companyService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Retrieve a company by identifier.' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(+id);
  }

  /**
   * Public endpoint: fetch minimal company data by publicToken.
   * Used by the pre-inscription page before any user is authenticated.
   */
  @Get('public/:publicToken')
  @ApiResponse({
    status: 200,
    description:
      'Retrieve public company information (e.g. name, logo, colors) using its publicToken.',
  })
  findByPublicToken(@Param('publicToken') publicToken: string) {
    return this.companyService.findByPublicToken(publicToken);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Update an existing company. Supports logo file upload (JPEG, PNG, GIF, WebP, max 2MB).' })
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Allow unknown properties for multipart/form-data
    transform: true,
    skipMissingProperties: true,
  }))
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req: any, file, cb) => {
          const companyId = req.params.id;
          if (!companyId) {
            return cb(new Error('Company ID is required'), '');
          }
          const uploadPath = path.join(process.cwd(), 'uploads', `${companyId}`, 'company');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}_${sanitized}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        return cb(null, false);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    // Clean the body - remove any unwanted fields that might come from multipart/form-data
    const updateCompanyDto: UpdateCompanyDto = {};
    
    // Only include valid DTO fields
    const validFields = ['name', 'email', 'phone', 'city', 'country', 'address', 'codePostal', 'status', 'primaryColor', 'secondaryColor', 'tertiaryColor', 'logo', 'captchaToken', 'captchaAnswer', 'entete_1', 'entete_2', 'entete_3', 'pied_1', 'pied_2', 'pied_3', 'logo_left', 'logo_right', 'papier_entete'];
    // Fields that can be set to null/empty (nullable optional fields)
    const nullableFields = ['phone', 'city', 'country', 'address', 'codePostal', 'logo', 'entete_1', 'entete_2', 'entete_3', 'pied_1', 'pied_2', 'pied_3'];
    // Boolean fields that need special handling
    const booleanFields = ['logo_left', 'logo_right', 'papier_entete'];
    
    for (const field of validFields) {
      if (body[field] !== undefined) {
        // Handle nested data object (if frontend sends { data: { ... } })
        const value = body.data && typeof body.data === 'object' ? body.data[field] : body[field];
        
        // Skip if it's an object representation of null/undefined
        if (typeof value === 'string' && (value === 'null' || value === 'undefined' || value === '[object Object]')) {
          continue;
        }
        
        // Handle boolean fields
        if (booleanFields.includes(field)) {
          (updateCompanyDto as any)[field] = value === true || value === 'true';
          continue;
        }
        
        // For nullable fields, allow empty strings to be set as null
        if (nullableFields.includes(field)) {
          if (value === '' || value === null) {
            (updateCompanyDto as any)[field] = null;
          } else if (value !== undefined) {
            (updateCompanyDto as any)[field] = value;
          }
        } else {
          // For non-nullable fields, skip empty strings
          if (value !== undefined && value !== null && value !== '') {
            (updateCompanyDto as any)[field] = value;
          }
        }
      }
    }
    
    // Handle file upload
    if (file) {
      const relative = path.posix.join('uploads', `${id}`, 'company', path.basename(file.path));
      updateCompanyDto.logo = `/${relative.replace(/\\/g, '/')}`;
    } else if (updateCompanyDto.logo !== undefined) {
      // If logo field is provided but not a file, validate it's a string
      const val: any = updateCompanyDto.logo;
      if (typeof val !== 'string' || val === '[object Object]' || val === 'null' || val === 'undefined') {
        delete updateCompanyDto.logo;
      }
    }
    
    return this.companyService.update(+id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Remove a company record.' })
  remove(@Param('id') id: string) {
    return this.companyService.remove(+id);
  }
}
