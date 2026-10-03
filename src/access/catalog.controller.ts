import { Controller, Get } from '@nestjs/common';
import { CONTENT_ASSETS, OFFERS } from './access.catalog';

/** Public catalog (no files, no member data). */
@Controller('catalog')
export class CatalogController {
  @Get()
  catalog() {
    return {
      assets: CONTENT_ASSETS.map(({ file: _file, ...asset }) => asset),
      offers: Object.entries(OFFERS).map(([id, offer]) => ({ id, ...offer })),
    };
  }
}
