import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GenresService } from './genres.service';
import { Genre } from './genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new genre' })
  @ApiResponse({
    status: 201,
    description: 'Genre created successfully',
    type: Genre,
  })
  @ApiBody({
    type: CreateGenreDto,
    description: 'Genre data to create',
    examples: {
      example1: {
        summary: 'Action genre example',
        value: {
          name: 'Action',
          description: 'High-energy movies with exciting sequences',
          imageUrl: 'https://example.com/action-genre.jpg',
        },
      },
    },
  })
  async create(@Body() createGenreDto: CreateGenreDto): Promise<Genre> {
    return this.genresService.create(createGenreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  @ApiResponse({ status: 200, description: 'List of genres', type: [Genre] })
  async findAll(): Promise<Genre[]> {
    return this.genresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  @ApiResponse({ status: 200, description: 'Genre found', type: Genre })
  async findOne(@Param('id') id: string): Promise<Genre> {
    return this.genresService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update genre' })
  @ApiResponse({
    status: 200,
    description: 'Genre updated successfully',
    type: Genre,
  })
  @ApiBody({
    type: UpdateGenreDto,
    description: 'Genre data to update',
    examples: {
      example1: {
        summary: 'Update genre example',
        value: {
          name: 'Action & Adventure',
          description: 'High-energy movies with exciting action sequences and adventures',
          imageUrl: 'https://example.com/updated-action-genre.jpg',
        },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateGenreDto: UpdateGenreDto): Promise<Genre> {
    return this.genresService.update(+id, updateGenreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre' })
  @ApiResponse({ status: 200, description: 'Genre deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.genresService.remove(+id);
  }
}
