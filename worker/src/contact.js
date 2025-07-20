// Environment variables needed:
// JMAP_TOKEN - Fastmail API token
// LOGIN_EMAIL - Email for Fastmail account
// PERSONAL_EMAIL - Email that the contact form will send the content to
// CONTACT_FORM_EMAIL - From email for the contact form

export const handleContactForm = async (request, env) => {
  // Check origin
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  const allowedOrigin = 'https://www.diegoripley.ca';
  const allowedReferer = 'https://www.diegoripley.ca/contact/';

  // Verify request is coming from allowed origin/page
  if (origin !== allowedOrigin && (!referer || !referer.startsWith(allowedReferer))) {
    return new Response('Forbidden', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405
    });
  }

  try {
    // Parse the form data
    const formData = await request.json();
    const { email, name, message } = formData;

    // Validate required fields
    if (!email || !name || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: email, name, and message are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        },
      });
    }

    // Check required environment variables
    if (!env.JMAP_TOKEN || !env.LOGIN_EMAIL || !env.PERSONAL_EMAIL || !env.CONTACT_FORM_EMAIL) {
        throw new Error('Missing required environment variables: JMAP_TOKEN, LOGIN_EMAIL, PERSONAL_EMAIL, and CONTACT_FORM_EMAIL');
    }

    const username = env.LOGIN_EMAIL;
    const authUrl = `https://api.fastmail.com/.well-known/jmap`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.JMAP_TOKEN}`,
    };

    // Get JMAP session
    const sessionResponse = await fetch(authUrl, {
      method: "GET",
      headers,
    });

    if (!sessionResponse.ok) {
      throw new Error('Failed to get JMAP session');
    }

    const session = await sessionResponse.json();
    const apiUrl = session.apiUrl;
    const accountId = session.primaryAccounts["urn:ietf:params:jmap:mail"];

    // Query for Drafts mailbox
    const mailboxResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        using: ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
        methodCalls: [
          ["Mailbox/query", { accountId, filter: { name: "Drafts" } }, "a"],
        ],
      }),
    });

    const mailboxData = await mailboxResponse.json();
    const draftId = mailboxData["methodResponses"][0][1].ids[0];

    // Query for Identity
    const identityResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        using: [
          "urn:ietf:params:jmap:core",
          "urn:ietf:params:jmap:mail",
          "urn:ietf:params:jmap:submission",
        ],
        methodCalls: [["Identity/get", { accountId, ids: null }, "a"]],
      }),
    });

    const identityData = await identityResponse.json();
    const identityId = identityData["methodResponses"][0][1].list.filter(
      (identity) => identity.email === username
    )[0].id;


    // Create email body
    const messageBody = `Contact form submission from www.diegoripley.ca/contact/:

Name: ${name}
Email: ${email}

Message:
${message}
`;

    // Create draft object
    const draftObject = {
      from: [{ email: env.CONTACT_FORM_EMAIL }],
      to: [{ email: env.PERSONAL_EMAIL }],
      replyTo: [{ email: email, name: name }],
      subject: `Contact Form: ${name}`,
      keywords: { $draft: true },
      mailboxIds: { [draftId]: true },
      bodyValues: { body: { value: messageBody, charset: "utf-8" } },
      textBody: [{ partId: "body", type: "text/plain" }],
    };

    // Create and send email
    const emailResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        using: [
          "urn:ietf:params:jmap:core",
          "urn:ietf:params:jmap:mail",
          "urn:ietf:params:jmap:submission",
        ],
        methodCalls: [
          ["Email/set", { accountId, create: { draft: draftObject } }, "a"],
          [
            "EmailSubmission/set",
            {
              accountId,
              onSuccessDestroyEmail: ["#sendIt"],
              create: { sendIt: { emailId: "#draft", identityId } },
            },
            "b",
          ],
        ],
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email via JMAP');
    }

    const emailData = await emailResponse.json();
    
    // Check for errors in the response
    const emailSetResponse = emailData["methodResponses"][0][1];
    const submissionSetResponse = emailData["methodResponses"][1][1];

    if (emailSetResponse.notCreated || submissionSetResponse.notCreated) {
      console.error('JMAP Error:', JSON.stringify(emailData, null, 2));
      throw new Error('Failed to create or submit email');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your message! I\'ll get back to you soon.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit contact form. Please try again later.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://www.diegoripley.ca',
      },
    });
  }
};
