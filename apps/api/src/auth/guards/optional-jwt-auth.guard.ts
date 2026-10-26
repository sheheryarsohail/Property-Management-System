import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any) {
    // Return user if valid token, or null if no token or error, without throwing
    return user || null;
  }
}
