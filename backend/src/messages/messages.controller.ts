import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { MessagesService } from './messages.service';

class SetReadDto {
  @IsBoolean()
  read: boolean;
}

/**
 * Admin inbox for contact submissions. Paths span `sites/:siteId/messages`
 * (list/count) and `messages/:id` (update/delete). Global `api` prefix applies.
 */
@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** GET /api/sites/:siteId/messages/unread-count (declared before :siteId list is fine — distinct path). */
  @Get('sites/:siteId/messages/unread-count')
  unreadCount(@Param('siteId') siteId: string) {
    return this.messages.unreadCount(siteId);
  }

  @Get('sites/:siteId/messages')
  list(
    @Param('siteId') siteId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unread') unread?: string,
  ) {
    return this.messages.list(siteId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unread === 'true' || unread === '1',
    });
  }

  @Patch('messages/:id')
  setRead(@Param('id') id: string, @Body() dto: SetReadDto) {
    return this.messages.setRead(id, dto.read);
  }

  @Delete('messages/:id')
  remove(@Param('id') id: string) {
    return this.messages.remove(id);
  }
}
