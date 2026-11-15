import {
	ClassSerializerInterceptor,
	Controller,
	Get,
	Req,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('dashboard')
@ApiTags('dashboard')
@ApiBearerAuth('token')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get('stats')
	@ApiOperation({
		summary:
			'Get dashboard statistics. Admin gets global stats, Author gets own stats.',
	})
	async getStats(@Req() request: RequestWithUser) {
		return this.dashboardService.getStats(request.user);
	}
}

