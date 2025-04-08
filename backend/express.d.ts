declare global {
    namespace Express {
      interface Request {
        userId?: string | number;
        user?: any;
        userOrganizations?: Array<{
          id: string | number;
          role: string;
          [key: string]: any;
        }>;
        organizationId?: string | number;
        userRoleInOrg?: string;
        organizationModules?: Array<{
          code: string;
          name: string;
          active: boolean;
          subscription_end_date?: Date;
          [key: string]: any;
        }>;
        userModulePermissions?: Record<string, any>;
        userRole?: string;
      }
    }
  }
  
  export {}; // To make it a module and avoid TS1064 error