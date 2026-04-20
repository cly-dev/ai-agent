import { mapPrismaTypeToTs, parseSchemaModels } from './prisma-schema-codegen';

describe('prisma-schema-codegen', () => {
  it('maps scalar prisma types to typescript', () => {
    expect(mapPrismaTypeToTs('Int')).toBe('number');
    expect(mapPrismaTypeToTs('DateTime')).toBe('Date');
    expect(mapPrismaTypeToTs('Json')).toBe('unknown');
  });

  it('parses model fields including optional and relation fields', () => {
    const schema = `
model User {
  id Int @id @default(autoincrement())
  name String
  profile Profile?
}
model Profile {
  id Int @id
}
`;

    const models = parseSchemaModels(schema);
    const user = models.find((model) => model.name === 'User');
    expect(user).toBeDefined();
    expect(user?.fields.find((field) => field.name === 'id')?.hasDefault).toBe(
      true,
    );
    expect(
      user?.fields.find((field) => field.name === 'profile')?.isRelation,
    ).toBe(true);
    expect(
      user?.fields.find((field) => field.name === 'profile')?.isOptional,
    ).toBe(true);
  });
});
