import type { KnowledgeService } from './knowledge.service.ts';
import type { CreateCategoryInput, UpdateCategoryInput, CreateKnowledgeBaseInput, UpdateKnowledgeBaseInput, BulkCreateKnowledgeBaseInput } from './validators/knowledge.validator.ts';
import { ApiResponse } from '../../core/helpers/response.ts';

export class KnowledgeController {
  constructor(private readonly serviceFactory: (tenantSlug: string) => Promise<KnowledgeService>) {}

  // ── Categories ─────────────────────────────────────

  async listCategories(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const service = await this.serviceFactory(tenantSlug);
    const categories = await service.listCategories();
    return ApiResponse.success(c, categories);
  }

  async getCategory(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    const category = await service.getCategory(id);
    return ApiResponse.success(c, category);
  }

  async createCategory(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const body = c.req.valid('json') as CreateCategoryInput;
    const service = await this.serviceFactory(tenantSlug);
    const category = await service.createCategory(body);
    return ApiResponse.created(c, category, 'Knowledge category created successfully');
  }

  async updateCategory(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateCategoryInput;
    const service = await this.serviceFactory(tenantSlug);
    const category = await service.updateCategory(id, body);
    return ApiResponse.success(c, category, 'Knowledge category updated successfully');
  }

  async deleteCategory(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    await service.deleteCategory(id);
    return ApiResponse.success(c, null, 'Knowledge category deleted successfully');
  }

  // ── Knowledge Bases ────────────────────────────────

  async listKnowledgeBases(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const catId = c.req.param('catId');
    const service = await this.serviceFactory(tenantSlug);
    const knowledgeBases = await service.listByCategory(catId);
    return ApiResponse.success(c, knowledgeBases);
  }

  async getKnowledgeBase(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    const kb = await service.getKnowledgeBase(id);
    return ApiResponse.success(c, kb);
  }

  async createKnowledgeBase(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const catId = c.req.param('catId');
    const body = c.req.valid('json') as CreateKnowledgeBaseInput;
    const service = await this.serviceFactory(tenantSlug);
    const kb = await service.createKnowledgeBase(catId, body);
    return ApiResponse.created(c, kb, 'Knowledge base created successfully');
  }

  async updateKnowledgeBase(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const body = c.req.valid('json') as UpdateKnowledgeBaseInput;
    const service = await this.serviceFactory(tenantSlug);
    const kb = await service.updateKnowledgeBase(id, body);
    return ApiResponse.success(c, kb, 'Knowledge base updated successfully');
  }

  async deleteKnowledgeBase(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const id = c.req.param('id');
    const service = await this.serviceFactory(tenantSlug);
    await service.deleteKnowledgeBase(id);
    return ApiResponse.success(c, null, 'Knowledge base deleted successfully');
  }

  async bulkCreateKnowledgeBases(c: any) {
    const tenantSlug = c.get('tenantSlug');
    const catId = c.req.param('catId');
    const body = c.req.valid('json') as BulkCreateKnowledgeBaseInput;
    const service = await this.serviceFactory(tenantSlug);
    const knowledgeBases = await service.bulkCreateKnowledgeBases(catId, body.items);
    return ApiResponse.created(c, knowledgeBases, 'Knowledge bases created successfully');
  }
}
