import { config } from "../config";

// Local Supabase delivers all email to Mailpit; tests read it over HTTP.
interface MailpitMessageSummary {
  ID: string;
  To: { Address: string }[];
}

export async function findLatestEmailTo(
  email: string,
  attempts = 10,
  delayMs = 500,
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(`${config.mailpitUrl}/api/v1/messages`);
    const json = (await response.json()) as {
      messages: MailpitMessageSummary[];
    };

    const message = json.messages?.find((m) =>
      m.To.some((to) => to.Address.toLowerCase() === email.toLowerCase()),
    );

    if (message) {
      const body = await fetch(
        `${config.mailpitUrl}/api/v1/message/${message.ID}`,
      );
      const bodyJson = (await body.json()) as { Text: string; HTML: string };
      return bodyJson.HTML || bodyJson.Text;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`No email received for ${email}`);
}

export function extractRecoveryTokenHash(emailBody: string): string {
  // The custom recovery template links to:
  // {SITE_URL}/auth/reset-password?token_hash=<token_hash>
  const match = emailBody.match(/token_hash(?:=|=3D)([^&\s"']+)/i);

  if (!match) {
    throw new Error("No recovery token found in email body");
  }

  return decodeURIComponent(match[1]);
}
