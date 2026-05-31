import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RateProfileDto } from './dto/rate-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthRequest = { user: { id: string; username: string } };

function makeStorage(dest: string) {
  return diskStorage({
    destination: `./uploads/${dest}`,
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
  });
}

const imageValidators = [
  new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
  new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
];

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthRequest) {
    return this.usersService.getMe(req.user.id);
  }

  @Get('top')
  getTop() {
    return this.usersService.getTopProfiles();
  }

  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { storage: makeStorage('avatars') }))
  uploadAvatar(
    @Req() req: AuthRequest,
    @UploadedFile(new ParseFilePipe({ validators: imageValidators })) file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(req.user.id, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/banner')
  @UseInterceptors(FileInterceptor('file', { storage: makeStorage('banners') }))
  uploadBanner(
    @Req() req: AuthRequest,
    @UploadedFile(new ParseFilePipe({ validators: imageValidators })) file: Express.Multer.File,
  ) {
    return this.usersService.updateBanner(req.user.id, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Req() req: AuthRequest, @Param('id') receiverId: string) {
    return this.usersService.toggleLike(req.user.id, receiverId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  rateProfile(
    @Req() req: AuthRequest,
    @Param('id') receiverId: string,
    @Body() dto: RateProfileDto,
  ) {
    return this.usersService.rateProfile(req.user.id, receiverId, dto);
  }
}
