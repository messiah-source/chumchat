import { Module } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [GamificationModule, TagsModule],
  providers: [ContestsService],
  controllers: [ContestsController],
})
export class ContestsModule {}
