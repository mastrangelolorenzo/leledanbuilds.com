import { sendMail, isValidEmailForHeader } from '../lib/smtp'

export const INQUIRY_TYPES = ['General Question', 'Custom Build Request', 'Order Support', 'Business Inquiry', 'Other'] as const

const BUSINESS_EMAIL = 'leledanbusiness@gmail.com'
const MAX_MESSAGE_LENGTH = 2000

interface Body {
  name?: string
  email?: string
  inquiryType?: string
  message?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const inquiryType = body.inquiryType?.trim()
  const message = body.message?.trim()

  if (!name || !email || !isValidEmailForHeader(email) || !inquiryType || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Name, a valid email, inquiry type, and message are required.' })
  }
  if (!(INQUIRY_TYPES as readonly string[]).includes(inquiryType)) {
    throw createError({ statusCode: 400, statusMessage: `Inquiry type must be one of: ${INQUIRY_TYPES.join(', ')}.` })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` })
  }

  const env = event.context.cloudflare?.env
  if (!env) {
    throw createError({ statusCode: 503, statusMessage: 'Service unavailable.' })
  }

  await sendMail(env, {
    to: BUSINESS_EMAIL,
    replyTo: email,
    subject: `[Contact form] ${inquiryType} — ${name}`,
    text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nInquiry type: ${inquiryType}\n\nMessage:\n${message}`,
  })

  return { success: true }
})
