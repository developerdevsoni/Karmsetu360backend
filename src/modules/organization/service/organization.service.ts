import { OrganizationRepository } from '../repository/organization.repository';
import { AppError } from '../../../utils/response';

export class OrganizationService {
  public static async createOrganization(name: string, logoUrl?: string) {
    return OrganizationRepository.create(name, logoUrl);
  }

  public static async updateOrganization(id: string, data: any) {
    const org = await OrganizationRepository.findById(id);
    if (!org) {
      throw new AppError('Organization profile not found.', 404);
    }
    return OrganizationRepository.update(id, data);
  }

  public static async getOrganization(id: string) {
    const org = await OrganizationRepository.findById(id);
    if (!org) {
      throw new AppError('Organization profile not found.', 404);
    }
    return org;
  }

  public static async listOrganizations() {
    return OrganizationRepository.findAll();
  }

  public static async getSettings(orgId: string) {
    const settings = await OrganizationRepository.getSettings(orgId);
    if (!settings) {
      throw new AppError('Organization settings not found.', 404);
    }
    return settings;
  }

  public static async updateSettings(orgId: string, data: any) {
    return OrganizationRepository.updateSettings(orgId, data);
  }
}
