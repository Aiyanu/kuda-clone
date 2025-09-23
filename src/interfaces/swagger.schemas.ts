/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         name:
 *           type: string
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     ForgotPassword:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     ResetPassword:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - token
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         token:
 *           type: string
 *     InitiatePaystackDeposit:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *     VerifyPaystackDeposit:
 *       type: object
 *       required:
 *         - reference
 *       properties:
 *         reference:
 *           type: string
 *     MakeInternalTransfer:
 *       type: object
 *       required:
 *         - toAccountId
 *         - amount
 *       properties:
 *         toAccountId:
 *           type: string
 *         amount:
 *           type: number
 *     MakeWithdrawalByPaystack:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *     CreateAccount:
 *       type: object
 *       required:
 *         - accountType
 *         - userId
 *       properties:
 *         accountType:
 *           type: string
 *         userId:
 *           type: string
 */
