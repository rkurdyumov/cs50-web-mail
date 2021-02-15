document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // Additional buttons.
  document.querySelector('#compose-form').addEventListener('submit', submit_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipient='', subject='', timestamp = '', body='') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // By default, clear out composition fields
  document.querySelector('#compose-recipients').value = recipient;
  if (timestamp) {
    subject = `Re: ${subject}`;
    body = `On ${timestamp} ${recipient} wrote:` + '\n' + `${body}`;
  }
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function submit_email(event) {
  event.preventDefault(); // Don't reload page on submit.

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    result.error ? alert(result.error): load_mailbox('sent');
  });
}

function update_read(email_id, read=true) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: read
    })
  })
}

function update_archived(email_id, archived=true) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archived
    })
  })
}

function load_email(email_id, mailbox) {

  // Show the email and hide other views
  document.querySelector('#email-view').innerHTML = '';  // Clear old email.
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      if (email.error) {
        alert(email.error);
      } else {
        document.querySelector('#email-view').innerHTML =
          `<h3>${email.subject}</h3>` +
          '<button id="reply">Reply</button> ';

        document.querySelector('#reply').addEventListener('click', () => {
          compose_email(email.sender, email.subject, email.timestamp, email.body);
        });

        if (mailbox === "inbox" || mailbox === "archive") {
          const button = document.createElement('button');
          const fromInbox = mailbox === "inbox";
          button.innerHTML = fromInbox ? "Archive" : "Unarchive";
          button.addEventListener('click', () => {
            update_archived(email_id, archived=fromInbox);
            load_mailbox('inbox');
          });
          document.querySelector('#email-view').append(button);
        }

        const content = document.createElement('div');
        content.classList.add('email-body');
        content.innerHTML = `<p><strong>From:</strong> ${email.sender}<br>` +
                            `<strong>To:</strong> ${email.recipients}</p>` +
                            `<p><strong>Time:</strong> ${email.timestamp}</p>` +
                            `<p>${email.body}</p>`
        document.querySelector('#email-view').append(content);
      }
    });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
          const element = document.createElement('div');
          element.classList.add('email-preview');
          element.style.backgroundColor = email.read ? 'lightgray': 'white';
          element.style.fontWeight = email.read ? 'normal' : 'bold';
          element.innerHTML = `<span class="align-left">${email.sender}</span>` +
                              `<span class="align-center">${email.subject}</span>` +
                              `<span class="align-right">${email.timestamp}</span>`;
          element.addEventListener('click', () => {
            update_read(email.id);
            load_email(email.id, mailbox);
          });
          document.querySelector('#emails-view').append(element);
        });
    });
}