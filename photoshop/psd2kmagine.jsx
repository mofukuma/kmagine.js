//
// psd2html.jsx
//
// psdのレイヤーを個別に切り出し、トリミングしてPNGで保存。
// くまじんのロードデータ、シーンデータに変換する by mofukuma 
//
// ・作成 - 2011/4/25
// ・gif/jpgにも対応 - 2011/4/28
// ・独自形式も出力 - 2011/5/6
// ・enchant.js用のHTML+jsで出力  - 2012/8/1
// ・JSON出力に対応 - 2012/8/26
// ・kmagine.js用に機能を削る - 2013/11/20


//#include "3rdparty/json2.js" //一気にjson出力する
//#include "3rdparty/packer.js" //CSSスプライトに今後対応

try {

// 保存済？
if (documents.length == 0) {
    alert('ファイルを保存してから実行してください。');
    exit();
}

// 実行オプション
var trim_mode = true; //トリミングする？
//var trim_mode = false;

var outputFolder = 'img';//PNG出力フォルダ


pngOpt = new PNGSaveOptions();
pngOpt.interlaced = false;
pngOpt.ext = '.png';

//ピクセルモードに
var strtRulerUnits = preferences.rulerUnits;
if (strtRulerUnits != Units.PIXELS) {
    preferences.rulerUnits = Units.PIXELS;
}

var srcDoc = activeDocument;
var srcFileName = activeDocument.fullName.fsName.toString();

var baseName = srcDoc.name.toString().replace(/\.psd/i, "");
var basePath = srcDoc.path.fsName.toString();

var kz = 100; //基本となる描画優先度z-indexの値

var layerVisibleOnly = true; //見えているレイヤーのみ処理

var sw = ('' + srcDoc.width).replace(' px', '');
var sh = ('' + srcDoc.height).replace(' px', '');

// 前処理
var pngPath = basePath + '\\' + baseName + '_png';
var imgPath = pngPath + '\\' + outputFolder;

var newFolder = new Folder(pngPath);
if (!newFolder.exists) newFolder.create();

newFolder = new Folder(imgPath);
if (!newFolder.exists) newFolder.create();

var htmldivtag = '<html><body>';
var header = "var _km = _km||{};\n\
_km.preloads = _km.preloads || [];\n\
_km.preloads = _km.preloads.concat([\n"
;
var json = "{'"+ baseName +"':{children:{\n";
var files = {};

splitLayers(srcDoc, '', kz);



// 新規ドキュメントのカラーモードを設定
function makeDocMode(srcmode) {
    switch (srcmode) {
        case DocumentMode.BITMAP:
            return NewDocumentMode.GRAYSCALE;
        case DocumentMode.CMYK:
            return NewDocumentMode.CMYK;
        case DocumentMode.DUOTONE:
            return NewDocumentMode.RGB;
        case DocumentMode.GRAYSCALE:
            return NewDocumentMode.GRAYSCALE;
        case DocumentMode.INDEXEDCOLOR:
            return NewDocumentMode.RGB;
        case DocumentMode.LAB:
            return NewDocumentMode.LAB;
        case DocumentMode.MULTICHANNEL:
            return NewDocumentMode.RGB;
        case DocumentMode.RGB:
            return NewDocumentMode.RGB;
        default:
            return NewDocumentMode.RGB;
    }

}

//範囲FIX
function fixnum(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

//領域
function getArea(p, s, w, h) {
    if (!p)
        p = [0, 0];

    this.left = Number(s[0]) - Number(p[0]);
    this.top = Number(s[1]) - Number(p[1]);
    this.right = Number(s[2]) - Number(p[0]);
    this.bottom = Number(s[3]) - Number(p[1]);

    this.width = this.right - this.left;
    this.height = this.bottom - this.top;
}


// レイヤー数だけ繰り返し
function splitLayers(srcLevel, newName, z) {

    var loop, c, newDoc, newFile, layerName;
    var layerNames = [];

    //レイヤーセット（グループ）があれば再帰呼び出し
    var gz = z;
    for (loop = srcLevel.layerSets.length - 1; loop > -1; loop--) {
        if (!srcLevel.layerSets[loop].visible) //グループが非表示の時はスキップ
            continue;
        gz += 100;

        c = new getArea(srcLevel.bounds, srcLevel.layerSets[loop].bounds, sw, sh);
        var tag = '\n<div id=' + srcLevel.layerSets[loop].name + '  style="left:' + c.left + 'px;top:' + c.top + 'px;width:' + c.width + 'px;height:' + c.height + 'px; __POSITION__ z-index:' + gz + ';">\n';

        htmldivtag += tag;

        //今のシーンをスタックに積む
        var k = srcLevel.layerSets[loop].name;
        json += ",'" + k + "': {x:" + c.left + ", y:" + c.top + ", 'z-index':" + gz+ ", children:{\n";

        //再帰
        //splitLayers(srcLevel.layerSets[loop], newName + srcLevel.layerSets[loop].name + '_', gz+1); //idにグループ名をつけるか
        splitLayers(srcLevel.layerSets[loop], newName, gz + 1);

        json += '}}\n';

        htmldivtag += '</div>\n';
    }

    var loopTimes = srcLevel.artLayers.length;

    for (loop = loopTimes - 1; loop > -1; loop--) {
        if (srcLevel.artLayers[loop].visible || !layerVisibleOnly) {

            srcDoc.activeLayer = srcLevel.artLayers[loop];
            layerName = newName + srcLevel.artLayers[loop].name;

            c = new getArea(srcLevel.bounds, srcLevel.artLayers[loop].bounds, sw, sh);
            //c = new getArea(srcLevel.artLayers[loop].bounds);

            srcDoc.selection.selectAll();
            try {
                srcDoc.selection.copy();
            } catch (e) {
                continue;
            }

            layerNames[layerName] = (layerNames[layerName])? layerNames[layerName]+1 : 1;

            // 新規画像を元画像と同じ設定で作成
            newDoc = documents.add(srcDoc.width, srcDoc.height, srcDoc.resolution, "New Document", makeDocMode(srcDoc.mode), DocumentFill.TRANSPARENT);

            newDoc.bitsPerChannel = srcDoc.bitsPerChannel;
            newDoc.pixelAspectRatio = srcDoc.pixelAspectRatio;

            newDoc.selection.select(Array(Array(c.left, c.top), Array(c.right, c.top), Array(c.right, c.bottom), Array(c.left, c.bottom)), SelectionType.REPLACE, 0, false);
            newDoc.paste(true);
            newDoc.activeLayer.name = layerName;
            newDoc.mergeVisibleLayers();

            //レイヤー名重複時の処理
            if (layerNames[layerName] > 1)
                layerName = layerName + '(' + layerNames[layerName] + ')';

            //トリミング
            if (trim_mode == true)
                newDoc.trim(TrimType.TRANSPARENT, true, true, true, true);

            //文字列処理用のfix
            var w = ('' + newDoc.width).replace(' px', '');
            var h = ('' + newDoc.height).replace(' px', '');
            var x = c.left;
            var y = c.top;
            if (c.width > w) {
                x = fixnum(c.left, 0, sw - 1);
            }
            if (c.height > h) {
                y = fixnum(c.top, 0, sh - 1);
            }

            //接頭句による処理があればここへ
            var kind = layerName.split('_')[0];
            var k = layerName;
            if (kind == 't') { //レイヤー名の先頭が t_ 文字レイヤーとする
                //TODO
                htmldivtag += '<div id=' + layerName + ' style="font-size:' + (h) + 'px;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px; __POSITION__ z-index:' + z + ';">' + layerName + '</div>\n';
                json += ",'" + k + "':{kind:'text', src:'" + outputFolder + '/' + layerName + ".png',x:" + x + ',y:' + y + ',w:' + w + ',h:' + h + ',"z-index":' + z + '}\n';

            } else {

                htmldivtag += '<div id=' + layerName + ' style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px; __POSITION__ background-image:url(' + outputFolder + '/' + layerName + '.__FORMAT__); z-index:' + z + ';"></div>\n';

                json += ",'" + k + "':{sprite:'"+k+"', src:'" + outputFolder + '/' + layerName + ".png',x:" + x + ',y:' + y + ',w:' + w + ',h:' + h + ',"z-index":' + z + '}\n';

                files[outputFolder + '/' + layerName] = 1; //素材ロード用にファイル名を管理
                var key = outputFolder + '/' + layerName;
                
            }

            kz++;
            z++;

            newFile = new File(pngPath + '\\' + outputFolder + '\\' + layerName);
            newDoc.saveAs(newFile, pngOpt, false, Extension.LOWERCASE);

            newDoc.close();
        }
    }

}

// ファイル出力

function textWrite(naiyou, folderPath, fileName) {
    var outputFile = new File(folderPath + '\\' + fileName);

    outputFile.open("w");
    outputFile.write(naiyou);
    outputFile.close();
}



//後処理

htmldivtag += '</body></html>';

var imglist = [];
for (var k in files) {
    imglist.push(k + '.png');
}
var preload = "'" + imglist.join("',\n'") + "',\n";

var docw = ('' + srcDoc.width).replace(' px', '');
var doch = ('' + srcDoc.height).replace(' px', '');


json += '}}}\n';
json = json.replace(/(\n|\r|\r\n)/gm, '@#@');
json = json.replace(/{@#@,/g, '\n{'); //カンマが余計についちゃうのは置換で
json = json.replace(/@#@/g, '\n');

var footer = "]);";

var htmltag = htmldivtag.replace(/ px;/g, 'px;');

var htmlpng = htmltag.replace(/__FORMAT__/g, 'png').replace(/__POSITION__/g, 'position:absolute;');

textWrite(htmlpng, pngPath, baseName +".html");

textWrite(header + preload + json + footer, pngPath, baseName + '.kscene');

//ピクセルモードからもとに戻す
if (strtRulerUnits != Units.PIXELS) {
    preferences.rulerUnits = strtRulerUnits;
}

alert('完了');


} finally {


}





