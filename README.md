# SE4030 - Secure Software Development Assignment

## Vulnerability Identification, Remediation and OAuth/OpenID Connect Integration

This repository contains the secured version of the **Nestory** application used for the SE4030 Secure Software Development assignment.

The assignment focused on identifying security vulnerabilities in an existing software application, applying appropriate security fixes, and implementing an OAuth/OpenID Connect based authentication flow.

---

## Group Members

| # | Member Name | Index / Registration Number | Main Responsibility |
|---|---|---|---|
| 1 | Perera M.E.N. | IT23201514 | Authentication Security |
| 2 | Udawatta V.D. | IT23149908 | Authorization / Access Control |
| 3 | Saparamadu M.D.K.S. | IT23311336 | Input Validation, File Handling and API Data Security |
| 4 | Ransika A.D.L. | IT23308466 | Security Configuration and OAuth/OpenID Connect Integration |

> Replace the missing registration numbers before final submission.

---

## Original Project Repository

The original Nestory application used as the baseline for the security assessment is available at:

https://github.com/Nestory-Organization/Nestory

---

## Secured / Modified Repository

The application after identifying and remediating the security vulnerabilities is available at:

https://github.com/kusal2002/SSD-Nestory-Secure

The modified repository contains a detailed Git commit history showing the security fixes and OAuth/OpenID Connect implementation carried out by the group.

---

## Security Work Completed

The project was reviewed for multiple security weaknesses including areas such as:

- Authentication security
- Authorization and access control
- Input validation
- File upload security
- NoSQL and query injection
- Mass assignment
- CORS configuration
- HTTP security headers
- Error and stack trace disclosure
- Dependency vulnerabilities
- Login rate limiting
- Sensitive information exposure in logs
- OAuth/OpenID Connect security

The identified vulnerabilities were documented with:

- Root cause
- Affected files and routes
- Evidence before remediation
- Security fix applied
- Evidence after remediation

---

## OAuth / OpenID Connect Implementation

The application was extended with OpenID Connect authentication using **WSO2 Identity Server**.

The implementation uses the **Authorization Code Flow with PKCE (S256)**.

Important security controls implemented include:

- PKCE using S256
- `state` validation
- `nonce` validation
- Short-lived OIDC transactions
- HttpOnly transaction cookies
- One-time transaction consumption
- Identity mapping using OIDC `issuer` and `subject`
- Prevention of automatic account linking based only on email address
- Short-lived one-time frontend login handoff
- Protection against replayed or invalid handoff codes
- Sanitized authentication request logging
- TLS certificate validation

The existing Nestory local email/password authentication remains available alongside WSO2 authentication.

---


## Video Demonstration

A YouTube video demonstrating:

- Identified vulnerabilities
- Evidence of the vulnerabilities
- Security fixes applied
- Evidence after remediation
- OAuth/OpenID Connect implementation
- WSO2 authentication flow

is available at:

**YouTube Video:**  
https://youtu.be/jWAd9_0zEOA

---

## Important Security Notes

No real secrets, passwords, API keys, OAuth client secrets, active authorization codes, or JWTs should be committed to this repository.

Environment-specific credentials should be configured using environment variables and excluded from Git.

The OIDC temporary transaction and login-handoff stores currently use application memory for the assignment environment. A production multi-instance deployment should use a shared expiring store such as Redis.

---

## Course

**Module:** SE4030 - Secure Software Development  
**Assignment:** Vulnerability Identification, Remediation and OAuth/OpenID Connect Integration