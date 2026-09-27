# Vulnerability 1 - Candidate

## Title
Broken Object Level Authorization in Gamification APIs

## Status
Candidate

## Owner
Member 2: Authorization, Resource Ownership and Role Security

## Category
OWASP API1: 2023 - Broken Object Level Authorization (BOLA)
CWE-639: Authorization Bypass Through User Controlled Key

# Affected Area
Gamification APIs

## Candidate Root Cause
Several Gamification endpoints accept user controlled identifiers such as userId, childId or challengeID

The current code appears to use these identifoers to access or midofy gamification resources without consistently verifying that the authenticated requester is authorized to access the referenced user, child, or challenge.

## Example Functions
- getUserProfress()
- awardPoints()
- awardBadge()
- updateAchievementProgress()
- getUserBadges()
- getUserAchievements()
- getTransactionHistory()
- getTodayChallenge()
- updateTodayChallengeProgress()

## Test Scenario
Parent A attempts to access or modify Parent B / Child B gamification data
using Parent A's valid authentication token together with Parent B's userId
or Child B's childId.

## Expected Secure Result
The server should reject unauthorized cross-account access, normally with
HTTP 403 Forbidden.

## Actual Result
Not tested yet.

## Status
Candidate — must be reproduced before being reported as a confirmed vulnerability.