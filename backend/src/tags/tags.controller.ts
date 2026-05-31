import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { SearchUsersByTagsDto } from './dto/search-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  /** Autocomplete search — public */
  @Get('search')
  searchTags(@Query('q') q = '', @Query('limit') limit?: string) {
    return this.tagsService.search(q, limit ? parseInt(limit) : 20);
  }

  /** Popular tags — public */
  @Get('popular')
  getPopular(@Query('limit') limit?: string) {
    return this.tagsService.getPopular(limit ? parseInt(limit) : 30);
  }

  /** Search users by tag list — public */
  @Get('users')
  searchUsers(@Query() dto: SearchUsersByTagsDto) {
    return this.tagsService.searchUsersByTags(dto.tags, dto.limit, dto.offset);
  }

  /** Compatibility between two users — public */
  @Get('compatibility/:userId1/:userId2')
  getCompatibility(@Param('userId1') u1: string, @Param('userId2') u2: string) {
    return this.tagsService.getCompatibility(u1, u2);
  }

  /** My compatibility vs another user — auth */
  @UseGuards(JwtAuthGuard)
  @Get('compatibility/me/:userId')
  getMyCompatibility(@Req() req: AuthReq, @Param('userId') targetId: string) {
    return this.tagsService.getCompatibility(req.user.id, targetId);
  }

  /** Multi-compatibility — auth */
  @UseGuards(JwtAuthGuard)
  @Post('compatibility/multi')
  getMultiCompatibility(@Req() req: AuthReq, @Body('userIds') userIds: string[]) {
    return this.tagsService.getMultiCompatibility(req.user.id, userIds);
  }

  /** Add tag to self — auth */
  @UseGuards(JwtAuthGuard)
  @Post('me')
  addTag(@Req() req: AuthReq, @Body() dto: CreateTagDto) {
    return this.tagsService.addTagToUser(req.user.id, dto);
  }

  /** Remove tag from self — auth */
  @UseGuards(JwtAuthGuard)
  @Delete('me/:tagId')
  removeTag(@Req() req: AuthReq, @Param('tagId') tagId: string) {
    return this.tagsService.removeTagFromUser(req.user.id, tagId);
  }
}
