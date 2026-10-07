// Sends the member to the payment provider's hosted checkout, using
// whatever create-order-checkout / retry-order-payment /
// create-plan-change-checkout returned.
//
// Oen: a plain redirect to `redirectUrl`.
// ECPay AIO: the provider requires the browser itself to POST a signed
// form (`formPost`), so a hidden form is built and submitted instead. The
// fields are signed server-side and passed through untouched.
export function startProviderCheckout({ redirectUrl, formPost }) {
  if (formPost?.action && formPost.fields) {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = formPost.action
    form.acceptCharset = 'UTF-8'
    form.style.display = 'none'

    for (const [name, value] of Object.entries(formPost.fields)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
    return
  }

  // .assign() (not a `window.location.href =` property write) to satisfy
  // this repo's react-hooks immutability lint rule.
  window.location.assign(redirectUrl)
}
