'use server';

import { signIn, signOut } from '@/auth';
import { db } from '@/db';
import type { User } from '@prisma/client';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import bcryptjs from 'bcryptjs'
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { EmailNotVerifiedError } from '@/errors';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await isUsersEmailVerified(formData.get('email') as string);
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }

    if (error instanceof EmailNotVerifiedError) {
      return error?.message;
    }

    throw error;
  }
}

const signUpSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  password: z.string().min(3).max(255),
})

interface SignUpFormState {
  errors: {
    name?: string[],
    email?: string[],
    password?: string[],
    _form?: string[],
  }
}

export async function signUp(
  formState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const result = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors
    }
  }

  const isEmailExists = await findUserByEmail(result.data.email)

  if (isEmailExists) {
    return {
      errors: {
        email: [
          'Email already exists',
        ],
      },
    }
  }

  const hashed = await generatePasswordHash(result.data.password);

  const verificationToken = generateEmailVerificationToken();

  let user: User
  try {
    user = await db.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        password: hashed,
        emailVerifToken: verificationToken,
      }
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        errors: {
          _form: [error.message],
        },
      }
    }
    else {
      return {
        errors: {
          _form: ['Something went wrong'],
        },
      }
    }
  }

  await sendVerificationEmail(result.data.email, verificationToken)

  redirect(`/email/verify/send?email=${result.data.email}&verification_sent=1`)
}

export async function logout() {
  return await signOut()
}

export const findUserByEmail = async (email: string) => {
  return await db.user.findFirst({
    where: {
      email,
    }
  })
}

const generatePasswordHash = async (password: string) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

const generateEmailVerificationToken = () => {
  return randomBytes(32).toString('hex')
}

const sendVerificationEmail = async (email: string, token: string) => {
  const transporter: nodemailer.Transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 0,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const emailData = {
    from: '"Blog Nextjs Auth" <verification@test.com>',
    to: email,
    subject: 'Email Verification',
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="http://localhost:3000/email/verify?email=${email}&token=${token}">Verify Email</a>
    `,
  };

  try {
    await transporter.sendMail(emailData);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error
  }
};

export const resendVerificationEmail = async (email: string) => {
  const emailVerificationToken = generateEmailVerificationToken()

  try {
    await db.user.update({
      where: { email },
      data: { emailVerifToken: emailVerificationToken },
    });

    await sendVerificationEmail(email, emailVerificationToken)
  } catch (error) {
    return 'Something went wrong.'
  }

  return 'Email verification sent.'
};

export const verifyEmail = (email: string) => {
  return db.user.update({
    where: { email },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifToken: null,
    },
  });
}

export const isUsersEmailVerified = async (email: string) => {
  const user = await db.user.findFirst({
    where: { email },
  });

  if (!user) return true

  if (!user?.emailVerifiedAt) throw new EmailNotVerifiedError(`EMAIL_NOT_VERIFIED:${email}`)

  return true
}
