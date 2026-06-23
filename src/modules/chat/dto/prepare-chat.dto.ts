import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageContextMessageFieldsDto } from './page-context-fields.dto';

/** POST /chat/:sessionId/prepare 请求体：可选附带当前路由页面上下文。 */
export class PrepareChatDto extends PageContextMessageFieldsDto {
  @ApiPropertyOptional({
    description: '与 pageContext 等价；若同时存在以 pageContext 为准',
    deprecated: true,
  })
  page?: string;
}
