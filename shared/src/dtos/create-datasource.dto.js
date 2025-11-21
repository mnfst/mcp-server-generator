"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDatasourceDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Data Transfer Object for creating a new datasource connection.
 *
 * This DTO defines the required fields to establish a database connection.
 * Currently supports MySQL databases with plans to expand to other database types.
 *
 * @example
 * ```typescript
 * const datasource: CreateDatasourceDto = {
 *   name: 'Production MySQL',
 *   type: 'mysql',
 *   host: 'localhost',
 *   port: 3306,
 *   database: 'myapp',
 *   username: 'root',
 *   password: 'secret123'
 * };
 * ```
 */
class CreateDatasourceDto {
    /**
     * The display name for the datasource.
     * Used for identification in the UI and API responses.
     *
     * @validation Must be a non-empty string
     * @example 'Production MySQL Database'
     */
    name;
    /**
     * The type of database system.
     * Currently only 'mysql' is supported.
     *
     * @validation Must be one of: 'mysql'
     * @example 'mysql'
     */
    type;
    /**
     * The hostname or IP address of the database server.
     *
     * @validation Must be a non-empty string
     * @example 'localhost' | 'db.example.com' | '192.168.1.100'
     */
    host;
    /**
     * The port number on which the database server is listening.
     *
     * @validation Must be a valid number
     * @example 3306 (default MySQL port)
     */
    port;
    /**
     * The name of the database to connect to.
     *
     * @validation Must be a non-empty string
     * @example 'myapp_production'
     */
    database;
    /**
     * The username for database authentication.
     *
     * @validation Must be a non-empty string
     * @example 'root' | 'db_user'
     */
    username;
    /**
     * The password for database authentication.
     *
     * @security This field should be handled securely and never logged or exposed in responses
     * @validation Must be a non-empty string
     * @example 'secret_password_123'
     */
    password;
}
exports.CreateDatasourceDto = CreateDatasourceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDatasourceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['mysql']),
    __metadata("design:type", String)
], CreateDatasourceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDatasourceDto.prototype, "host", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDatasourceDto.prototype, "port", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDatasourceDto.prototype, "database", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDatasourceDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDatasourceDto.prototype, "password", void 0);
//# sourceMappingURL=create-datasource.dto.js.map