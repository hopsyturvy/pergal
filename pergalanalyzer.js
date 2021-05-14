//Uses the wonderful Vis.js from https://visjs.org/index.html
var AmLoaded = false,
    store = "AnalyzerSettings";
var data, network, selectedID, theNodes, theXXX, theEdges, broken = false, theFName = ""
var lastLoad = "", theevt
var theVarSeed=0
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}
function getUrlParam(parameter, defaultvalue) {
    var tmp = getUrlVars()[parameter];
    if (tmp) { return tmp } else { return defaultvalue }
}
$(document).ready(function () {
    //Set up the sliders and actions
    $("#Seed").slider()
    vars =getUrlVars()
    if (vars.log) {$("#Slider").slider({scale: 'logarithmic'})} else{$("#Slider").slider()}
     if (vars.seed) theVarSeed=Number(vars["seed"])
    $('#Capture').click(function () {
        Capture("Clip")
    });
    $('#Save').click(function () {
        Capture("Save")
    });
    $('#Reload').click(function () {
        Reload()
    });
    //setupInput(store, input);
    $("input").change(function () {
        if (AmLoaded) CalcIt();
    });
    $('#Example').click(function () {
        GetFile()
    })
    document.getElementById('Load').addEventListener('click', clearOldName, false);
    document.getElementById('Load').addEventListener('change', handleFileSelect, false);
    //Load the default choice in the Combo box
    GetFile()

});
function DrawIt() { //Update the vis when things change
    if (!AmLoaded) return;
    theXXX = []
    var hType=""
    $("#Title").html("<H3>" + theFName + " Analyzer</H3>")
    nodes = new vis.DataSet();
    var theKeys = Object.keys(theNodes.data[0])
    
    for (var i = 0; i < theNodes.data.length; i++) {
    //Remove xxx comments and place them in theXXX to re-add on copy/save
    if (theNodes.data[i].id.toUpperCase() == "XXX") {
            theXXX.push(theNodes.data[i])
            theNodes.data.splice(i, 1);
        }
   }
   for (var i = 0; i < theNodes.data.length; i++) {
    //Remove accidental empty nodes that Excel can sometimes provide
       if (theNodes.data[i].id=="") {
        theNodes.data.splice(i, 1);
    }
}
for (var i = 0; i < theNodes.data.length; i++) {
    console.log(theNodes.data[i])
    //Detect hierarchical
     if (theNodes.data[i].id=="hierarchy") {
        hType=theNodes.data[i].label.toUpperCase()
        if (hType!="UD" && hType!="DU" && hType!="LR" && hType!="RL") hType="DU"
        theXXX.push(theNodes.data[i])
        theNodes.data.splice(i,1);
    }
}


//Loop through the nodes to extract equations to include in Title text
//Plus other checks
    for (j = 0; j < theNodes.data.length; j++) {
        values = Object.values(theNodes.data[j])
        comment = ""
        if (! theNodes.data[j].conv) theNodes.data[j].conv=1 //At least something will work
        if (theNodes.data[j].comment) comment = "<br>" + theNodes.data[j].comment
        if (theNodes.data[j].equn.length > 1) {
            tequn = theNodes.data[j].equn.replace(new RegExp('{', 'g'), "")
            tequn = tequn.replace(new RegExp('}', 'g'), "")
            if (theNodes.data[j].title) { theNodes.data[j].title = theNodes.data[j].id + " '" + theNodes.data[j].title + "' = " + tequn + comment } else { theNodes.data[j].title = theNodes.data[j].id + " = " + tequn + comment }
        } else {
            if (theNodes.data[j].title) { theNodes.data[j].title = theNodes.data[j].id + " '" + theNodes.data[j].title + "'" + comment } else { theNodes.data[j].title = theNodes.data[j].id + comment }

        }
        gotColor = false
        //We need two colours for each node, hence this complication
        //It could be coded more neatly
        if (theNodes.data[j].color == "pink") { theNodes.data[j].color = { background: 'pink', highlight: 'hotpink' }; gotColor = true }
        if (theNodes.data[j].color == "blue") { theNodes.data[j].color = { background: 'skyblue', highlight: 'deepskyblue' }; gotColor = true }
        if (theNodes.data[j].color == "yellow") { theNodes.data[j].color = { background: 'yellow', highlight: 'gold' }; gotColor = true }
        if (theNodes.data[j].color == "salmon") { theNodes.data[j].color = { background: 'lightsalmon', highlight: 'salmon' }; gotColor = true }
        if (theNodes.data[j].color == "green") { theNodes.data[j].color = { background: 'lightgreen', highlight: 'green' }; gotColor = true }
        if (theNodes.data[j].color == "red") { theNodes.data[j].color = { background: 'tomato', highlight: 'orangered' }; gotColor = true }
        //Do some checks for basic errors
        if (!isNaN(theNodes.data[j].from)) { theNodes.data[j].from = parseFloat(theNodes.data[j].from) } else { if (theNodes.data[j].from!="-") alert("You have a non-numeric 'from' for " + theNodes.data[j].id) }
        if (!isNaN(theNodes.data[j].to)) { theNodes.data[j].to = parseFloat(theNodes.data[j].to) } else { if (theNodes.data[j].from!="-") alert("You have a non-numeric 'to' for " + theNodes.data[j].id) }
        if (!isNaN(theNodes.data[j].step)) { theNodes.data[j].step = parseFloat(theNodes.data[j].step) } else {if (theNodes.data[j].from!="-") alert("You have a non-numeric 'step' for " + theNodes.data[j].id) }
        //Backup if it's not an official colour
        if (!gotColor) theNodes.data[j].color = { background: 'pink', highlight: 'hotpink' }
        //}
    }
    nodes.add(theNodes.data)

    // create an array with edges
    // then get the edges from the equations
    edges = new vis.DataSet();

    // create a network
    var container = document.getElementById('network');
    data = {
        nodes: nodes,
        edges: edges
    };
    //We need to add the temporary label programmatically
    //Plus providing a dummy original value
    //then do the edges
    broken = false
    edgeNo = 0
    tmpNodes = (Object.entries(data.nodes._data))
    for (j = 0; j < tmpNodes.length; j++) {
        tmpNodes[j][1].tlabel = tmpNodes[j][1].label
        tmpNodes[j][1].oval = -99999
        tmp = tmpNodes[j][1].equn
        toNode = tmpNodes[j][1].id
        pos = 0
        //Use regex to extract all the variables
        var curMatch, rxp = /{([^}]+)}/g
        // The brute force method if I have to revert
        // while (tmp.indexOf("{", pos) > -1) {
        //     s = tmp.indexOf("{", pos)
        //     f = tmp.indexOf("}", s)
        //     pos = s + 1
        //     theID = tmp.substring(s + 1, f)
        while (curMatch = rxp.exec(tmp)) {
            theID = curMatch[1]
            if (nodes.get(theID)) {
                duplicate = false
                //We sometimes have the same "from" in the same equation
                tmpEdges = (Object.entries(data.edges._data))
                for (k = 0; k < tmpEdges.length; k++) {
                    if (tmpEdges[k][1].from == theID && tmpEdges[k][1].to == toNode) {
                        duplicate = true; break
                    }
                }
                if (!duplicate) {
                    edges.add({ id: "E" + edgeNo, from: theID, to: toNode })
                    edgeNo++
                }
            }
            else {//Alerting to errors is vital on load!
                alert("You have a non-existent node in an equation: {" + theID + "} \nSo no calculations will be performed")
                broken = true
            }
        }

    }

    //We'll find a better way to get optimum shape but this is fine for now
    var theSeed = 0.61
    if (theVarSeed>0) theSeed=theVarSeed
    if ($('#Example option:selected').text() == "Manure") theSeed = 0.63
    if ($('#Example option:selected').text() == "HomeCompost") theSeed = 0.60
    if ($('#Example option:selected').text() == "Coffee-Footprint") theSeed = 0.59
    if ($('#Example option:selected').text() == "Pergal-Fridge") theSeed = 494834
   //Vis allows many settings - these tweaks help for Open Analyzer
    var options = {
        "edges": {
            arrows: { to: true },
            width: 2, //Just a little tweak helps
            color: { color: "#aaa" },
            length: 200
        },
        "nodes": {
            "borderWidth": 0,
            "mass": 1.5 //This seems to be a near-optimum balance.
        },
        //"layout": { theLayout},
        //Physics doesn't seem to be helpful
        //   "physics": { //physics options tend to create unstable networks!
        //   "barnesHut": {
        //     "centralGravity": 0.5,
        //     "avoidOverlap": 0.4
        //   },
        // // "maxVelocity": 12,
        // //       "minVelocity": 0.05
        // }
    }
    options.layout={randomSeed: theSeed}
    if (!hType=="") options.layout={hierarchical: {direction: hType}}
    //?log=1&seed=0.234
    //Now we can make the network
    network = new vis.Network(container, data, options);
    //This allows the input for the slider to be set up
    network.on("click", function (params) {
        selectedID = network.getSelection().nodes[0]
        if (nodes.get(selectedID).to) { //Only if we have inputs
            $("#ILabel").text(nodes.get(selectedID).tlabel)
            theVal = nodes.get(selectedID).val * nodes.get(selectedID).conv
             $("#Slider").data('slider').options.min = nodes.get(selectedID).from
            $("#Slider").data('slider').options.max = nodes.get(selectedID).to
            $("#Slider").data('slider').options.step = nodes.get(selectedID).step
            $("#Slider").slider('setValue', theVal)
        } else {
            clearSlider()
        }
    });
    //On.stabilized is when things have sorted themselves out
    network.on("stabilized", function (params) {
        var moptions = { animation: { duration: 1500 }, scale: 1 }
        if ($('#Zoom1').is(':checked')) {
            network.fit(moptions)
            network.redraw() //Can hang if we don't have this
        }
    })
    CalcIt()


}
function clearSlider() {//Get rid of info on the input slider
    $("#ILabel").text("No Input Selected")
    theVal = 50
 //   $("#Slider").slider({scale: 'logarithmic'})
    $("#Slider").data('slider').options.min = 0
    $("#Slider").data('slider').options.max = 100
    $("#Slider").data('slider').options.step = 50
    $("#Slider").slider('setValue', theVal)
}
function CalcIt() { //Do the calculations
    if (broken) return //Don't calculate if there's a bad node
    var sens="",origval=$('#Slider').val()
    var kmax=0; if (selectedID){kmax=2} //kmax allows sensitivity analysis
    k=0

    for (k=kmax;k>-1;k--){
        if (selectedID) {
            if (k==0) theVal=origval / nodes.get(selectedID).conv
            if (k==1) theVal=$('#Slider').data('slider').options.min / nodes.get(selectedID).conv
            if (k==2) theVal=$('#Slider').data('slider').options.max / nodes.get(selectedID).conv
            //theVal = $('#Slider').val() / nodes.get(selectedID).conv
            nodes.update({ id: selectedID, val: theVal })
        }
 
    for (i = 0; i < 3; i++) { //If our calculations need to build up
        tmpNodes = (Object.entries(data.nodes._data))
        //Extract the equations from the {}, they might build up during the i-loop
        for (j = 0; j < tmpNodes.length; j++) {
            if (tmpNodes[j][1].equn) {
                tmp = tmpNodes[j][1].equn
                while (tmp.indexOf("{") > -1) {
                    s = tmp.indexOf("{")
                    f = tmp.indexOf("}")
                    theID = tmp.substring(s + 1, f)
                    if (nodes.get(theID)) {
                        theVal = nodes.get(theID).val
                        tmp = tmp.replace("{" + theID + "}", theVal)
                        tmp = tmp.replace("--", "+") //Fixes a bug with neg subtraction
                        try {
                            if (tmp.indexOf("{") == -1 && tmp.indexOf("?") == -1) {
                                nodes.update({ id: tmpNodes[j][1].id, val: eval(tmp) })
                            }
                        } catch (err) { alert("There is an error in equation: " + tmp); i = 4; break }
                    }
                }
            }
            thePrecision = 3 //Tricky to output numbers, try a default of 3 sig figs
            if (tmpNodes[j][1].oval == -99999 || isNaN(tmpNodes[j][1].oval)) {
                tmpNodes[j][1].oval = tmpNodes[j][1].val
            }
            theVal = tmpNodes[j][1].val * tmpNodes[j][1].conv
            if (theVal > 1000) thePrecision = 4
            if (theVal > 10000) thePrecision = 5
            if (tmpNodes[j][1].units) { units = tmpNodes[j][1].units + " " } else { units = "" }
            //Get the scaling. Use Abs to cope with sign changes, limit changes
            if (tmpNodes[j][1].oval == 0 || !$('#Changes').is(':checked') ) {
                fsize = 14 //No way to change it rationally
            }
            else {
                fsize = 14 *Math.sqrt(Math.abs(tmpNodes[j][1].val / tmpNodes[j][1].oval))
                fsize = Math.max(7, Math.min(fsize, 24))
            }
            if (i==2) sens+=tmpNodes[j][1].id+"\t"+tmpNodes[j][1].tlabel+"\t"+(theVal).toPrecision(thePrecision)+"\t"+units
            nodes.update({ id: tmpNodes[j][1].id, label: tmpNodes[j][1].tlabel + "\n" + units + (theVal).toPrecision(thePrecision), font: { size: fsize } })
        }
     }
     sens+="\n"
    }
if (kmax==2){
    copyTextToClipboard(sens)
    // $("#Slider").slider('setValue', origval)
}
}
function Reload() {
    if (theevt) handleFileSelect(theevt)
}

function clearOldName() { //This is needed because otherwise you can't re-load the same file name!
    $('#Load').val("")
}
function handleFileSelect(evt) {//Get the file - either the .csv or .html
    theevt = evt
    var f = evt.target.files[0];
    if (f) {
        var r = new FileReader();
        r.onload = function (e) {
            var D = e.target.result;
            if (!f.name.toUpperCase().includes(".HTML")) {
                theFName = f.name.replace(new RegExp(".csv", 'gi'), "")
                fhtml = theFName + ".html"
                $('#HTML').val("-")
                LoadData2(D)
            }
            else { //This will be the HTML .txt file
                $('#HTML').val(D)
            }
        }
        r.readAsText(f);
    } else {
        return;
    }
}

//Get a chosen file
function GetFile() {
    selectedID = false
    $.ajax({//By addint ?Date.now() we can avoid caching, to solve some problems
        url: "https://hopsyturvy.github.io/pergal/" + $('#Example option:selected').text() + ".csv",
    }).done(function (data) {
        LoadData(data)
    });

}
//Load data from a chosen file, using PapaParse which handles all the complexities
function LoadData(S) {
    if (S == lastLoad) return //Clicking on the same file
    theFName = $('#Example option:selected').text()
    lastLoad = S
    clearSlider()
    Papa.parse(S, {
        download: false,
        header: true,
        skipEmptyLines: true,
        complete: papaCompleteFn,
        error: papaErrorFn
    })
}
function papaErrorFn(error, file) {
    console.log("Error:", error, file)
}
function papaCompleteFn() {
    theNodes = arguments[0]
    AmLoaded = true
    GetHTML()
    DrawIt()
}

//Load data from second (HTML) file
function LoadData2(S) {
    Papa.parse(S, {
        download: false,
        header: true,
        skipEmptyLines: true,
        complete: papaCompleteFn2,
        error: papaErrorFn2
    })
}
function papaErrorFn2(error, file) {
    console.log("Error:", error, file)
}
function papaCompleteFn2() {
    theNodes = arguments[0]
     AmLoaded = true
    DrawIt()
}

function GetHTML() {//Read the HTML and put it onto the page in the Custom div
    $.ajax({
        type: "GET",
        url: "apps/inc/" + $('#Example option:selected').text() + ".html",
        success: function (data, status, xhr) {
            //At least add a paragraph format
            if (!data.trim().startsWith("<")) data = "<p>" + data.trim() + "</p>"
            document.getElementById("Custom").innerHTML = data
            //$('#HTML').val(data)
        },
        error: function (xhr, status, error) {
            //$('#HTML').val("-")
        },
    });
}
function Capture(Mode) {//Get the network and put on Clipboard or Save
    var colors = ['pink', 'blue', 'yellow', 'salmon', 'green', 'red']
    var theKeys = Object.keys(theNodes.data[0])
    var nodeText = theKeys[0]
    var tmps = []
    for (i = 1; i < theKeys.length; i++) nodeText += '\t' + theKeys[i]
    tmpNodes = (Object.entries(data.nodes._data))
    for (j = 0; j < tmpNodes.length; j++) {
        values = Object.values(tmpNodes[j][1])
        nodeText += '\n' + values[0]
        for (i = 1; i < theKeys.length; i++) {
            tmp = values[i]
            //We need to keep 0 but not null
            if (tmp == 0) { } else { if (!tmp) tmp = "-" }
            if (tmp.background) {
                bg = tmp.background
                for (k = 0; k < colors.length; k++) {
                    if (bg.includes(colors[k])) tmp = colors[k]
                }
            }
            //This gets rid of the units in Label and does no harm for the others
            tmps = tmp.toString().split('\n')
            nodeText += '\t' + tmps[0]
        }
    }
    //This is an inefficient way to save the xxx comments, but it works
    tmpNodes = (Object.entries(theXXX))
    for (j = 0; j < tmpNodes.length; j++) {
        values = Object.values(tmpNodes[j][1])
        nodeText += '\n' + values[0]
        for (i = 1; i < theKeys.length; i++) {
            tmp = values[i]
            //We need to keep 0 but not null
            if (tmp == 0) { } else { if (!tmp) tmp = "-" }
            if (tmp.background) {
                bg = tmp.background
                for (k = 0; k < colors.length; k++) {
                    if (bg.includes(colors[k])) tmp = colors[k]
                }
            }
            //This gets rid of the units in Label and does no harm for the others
            tmps = tmp.toString().split('\n')
            nodeText += '\t' + tmps[0]
        }
    }

    if (Mode == "Clip") {
        //We have to use copyTextToClipboard because Edge doesn't (yet) use async
        copyTextToClipboard(nodeText)
        tmp = $('#Capture').html()
        $('#Capture').html("Model Captured!")
        setTimeout(function () { $('#Capture').html(tmp) }, 1000);
    } else {
        nodeText = nodeText.replace(new RegExp('\t', 'g'), ",")
        theFName = $('#Example option:selected').text() + "_mod.csv"
        download(theFName, nodeText)
    }

}
function download(filename, text) { //Straightforward Download capability
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    //Courtesy of FileSaver.js
    //https://github.com/eligrey/FileSaver.js/
    saveAs(blob, filename);
}


function fallbackCopyTextToClipboard(text) { //Necessary if async not in browser
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    var elmnt = document.getElementById("network");
    elmnt.scrollIntoView();
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
    }

    document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
    }, function (err) {
    });
}