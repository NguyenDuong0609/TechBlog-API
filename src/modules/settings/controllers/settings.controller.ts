import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Get,
	Param,
	Put,
	Req,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('settings')
@ApiTags('settings')
@UseInterceptors(ClassSerializerInterceptor)
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	@Get()
	@ApiOperation({ summary: 'Get list of system settings (public for guests, all for admin)' })
	async getAll(@Req() request: any) {
		const isAdmin = request?.user?.role?.name === USER_ROLE.ADMIN || request?.user?.role === USER_ROLE.ADMIN;
		return this.settingsService.getAll(isAdmin);
	}

	@Get(':key')
	@ApiOperation({ summary: 'Get single setting by key' })
	@ApiParam({ name: 'key', description: 'Setting key string' })
	async getByKey(@Param('key') key: string, @Req() request: any) {
		const isAdmin = request?.user?.role?.name === USER_ROLE.ADMIN || request?.user?.role === USER_ROLE.ADMIN;
		return this.settingsService.getByKey(key, isAdmin);
	}

	@Put(':key')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiOperation({ summary: 'Admin create or update setting by key' })
	@ApiParam({ name: 'key', description: 'Setting key string' })
	async upsert(
		@Param('key') key: string,
		@Body() dto: UpdateSettingDto,
	) {
		return this.settingsService.upsert(key, dto);
	}
}

