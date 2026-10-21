import nodemailer from 'nodemailer'
import type { DemoRequest } from '../../../generated/prisma/client'
import { env } from '../../config/env'

export async function sendDemoRequestEmail(request: DemoRequest) {
  if (!env.SALES_INBOX_EMAIL || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP or sales inbox is not configured')
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  })

  await transporter.sendMail({
    from: env.SMTP_USER,
    to: env.SALES_INBOX_EMAIL,
    replyTo: request.email,
    subject: `Cartalog | Demonstração solicitada por ${request.companyName.replace(/[\r\n]/g, ' ')}`,
    text: [
      'Nova solicitação de demonstração do Cartalog',
      '',
      `Nome: ${request.name}`,
      `Loja: ${request.companyName}`,
      `E-mail: ${request.email}`,
      `Telefone: ${request.phone}`,
      `Mensagem: ${request.message || 'Não informada'}`,
      `Recebida em: ${request.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      `ID: ${request.id}`,
    ].join('\n'),
  })
}
