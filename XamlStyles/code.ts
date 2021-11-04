// This file holds the main code for the plugin. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

// Runs this code if the plugin is run in Figma
if (figma.editorType === 'figma') {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many rectangles on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'generate-styles') {
      const data = {
        colors: []
      };

      figma.getLocalPaintStyles()
        .forEach(paintStyle => {
          paintStyle.paints.forEach(paint => {
            if (paint.type === "SOLID") {
              data.colors.push(generateSolidBrush((paintStyle.paints.length > 1) ? `${paintStyle.name}/${camelize(paint.blendMode)}` : paintStyle.name, paint as SolidPaint));
            }
            else if (paint.type === 'GRADIENT_LINEAR') {
              data.colors.push(generateGradientBrush((paintStyle.paints.length > 1) ? `${paintStyle.name}/${camelize(paint.blendMode)}` : paintStyle.name, paint as GradientPaint));
            }
          })
        })

      //console.log("sending message to ui:");
      //console.log(data);
      figma.ui.postMessage({ type: "generated", data: data });
    }
    else if (msg.type === 'copy'){
      CopyToClipboard();
    }
    else if (msg.type === 'cancel'){
      figma.closePlugin();
    }
  };

  // If the plugins isn't run in Figma, run this code
} else {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many shapes and connectors on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    if (msg.type === 'generate-styles') {
      const data = {
        colors: []
      };

      figma.getLocalPaintStyles()
        .forEach(paintStyle => {
          paintStyle.paints.forEach(paint => {
            if (paint.type === "SOLID") {
              data.colors.push(generateSolidBrush(paintStyle.name, paint as SolidPaint));
            }
            else if (paint.type === 'GRADIENT_LINEAR') {
              data.colors.push(generateGradientBrush(paintStyle.name, paint as GradientPaint));
            }
          })
        })

      //console.log("sending message to ui:");
      //console.log(data);
      figma.ui.postMessage({ type: "generated", data: data });
    }
    else if (msg.type === 'copy'){
      CopyToClipboard();
    }
    else if (msg.type === 'cancel'){
      figma.closePlugin();
    }
  };
};

function generateSolidBrush(name: string, solidPaint: SolidPaint): string {

  name = name.replace(/[&\/\\#,+()$~%.'":;*?<>{}\s]/g, "");

  const rgb = {
    alpha: ColorToHex(BeautifyColor(solidPaint.opacity)),
    red: ColorToHex(BeautifyColor(solidPaint.color.r)),
    green: ColorToHex(BeautifyColor(solidPaint.color.g)),
    blue: ColorToHex(BeautifyColor(solidPaint.color.b)),
  };

  return `<SolidColorBrush x:Key="${name}" Color="#${rgb.alpha}${rgb.red}${rgb.green}${rgb.blue}" po:Freeze="True"/>`;
}

function generateGradientBrush(name: string, gradientPaint: GradientPaint) {

  name = name.replace(/[&\/\\#,+()$~%.'":;*?<>{}\s]/g, "");

  let result = `<LinearGradientBrush  x:Key="${name}r">\n`;
  gradientPaint.gradientStops.forEach(gradientStop => {
    const rgb = {
      alpha: ColorToHex(BeautifyColor(gradientStop.color.a)),
      red: ColorToHex(BeautifyColor(gradientStop.color.r)),
      green: ColorToHex(BeautifyColor(gradientStop.color.g)),
      blue: ColorToHex(BeautifyColor(gradientStop.color.b)),
    };
    result += `    <GradientStop Color="#${rgb.alpha}${rgb.red}${rgb.green}${rgb.blue}" Offset="${gradientStop.position}"/>\n`;
  });

  result += `</LinearGradientBrush>`;
  return result;
}

// Figma stores the color value as a 0 to 1 decimal instead of 0 to 255.
function BeautifyColor(colorValue) {
  return Math.round(colorValue * 255);
}

// Takes a single color (red, green, or blue) and changes it to hex
function ColorToHex(rgb) {
  let hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex.toUpperCase();
}

function RGBToHex(rgb) {
  const red = ColorToHex(rgb.red);
  const green = ColorToHex(rgb.green);
  const blue = ColorToHex(rgb.blue);
  return `#${red}${green}${blue}`;
}

// Reason for this to be a backend function is that the UI doesn't have access to the notify function
function CopyToClipboard() {
  figma.ui.postMessage({ type: "copy" });
  figma.notify("📋 Styles copied to clipboard.");
}

function camelize(text: string) {
  text = text.toLowerCase();
  return text.substr(0, 1).toUpperCase() + text.substr(1);
}