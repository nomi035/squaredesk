const { parse } = require('csv-parse/sync');

const content = `NPI,Name,Taxonomy,City,State,Postal Code,Practice Phone,Authorized First Name,Authorized Last Name,Authorized Phone,Enumeration Date,Disposition,Comment,NPI Type,Address,Country,authorized_official_credential,Speciality,Title,Date,Email Address
123,Test,123,City,ST,12345,1234567890,Auth,Last,1234567890,2024-01-01,,,NPI-2,123 St,US,MD,Spec,Title,2024,test@test.com`;

const rows = parse(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
});

console.log(rows[0]);
