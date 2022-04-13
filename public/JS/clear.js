function clearall()
{
    let checkBoxes = document.querySelectorAll("input[type='checkbox']")

    let radio = document.querySelectorAll("input[type = 'radio']")

    checkBoxes.forEach((item)=>item.checked = false)

    radio.forEach((item)=>item.checked = false)
}