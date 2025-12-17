import { Identity } from "@/types";
import { ROLE_PERMISSIONS } from "@/access/permissions";


export function canExecute(
identity: Identity,
permission: string
): boolean {
const perms = ROLE_PERMISSIONS[identity.role] || [];
return perms.includes(permission) || perms.includes("use:any:model");
}