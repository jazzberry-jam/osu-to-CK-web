var parser = module.require("OsuParser");
var toOutput = "";

// osu!mania tap and hold notes have x coordinate ranges that map to the different lanes (6 in our case)
// Deleted: FNF handling for 1p and 2p 
function hitobj_x_to_track_number(hitobj_x) {
	var track_number = 0;

	if (hitobj_x <= 32) {
		track_number = 0;
	} else if (hitobj_x <= 96) {
		track_number = 1;
	} else if (hitobj_x <= 160) {
		track_number = 2;
	} else if (hitobj_x <= 224) {
		track_number = 3;
	} else if (hitobj_x <= 352) {
		track_number = 4;
	} else if (hitobj_x <= 416) {
		track_number = 5;
	} else {
		track_number = 6;
	}
	
	return track_number;
}

function msToTime(s) {
	var ms = s % 1000;
	s = (s - ms) / 1000;
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;
	return hrs + ':' + mins + ':' + secs + '.' + ms;
}

function append_to_output(str) {
		toOutput += (str)
}

module.export("CKConverter", function(osu_file_contents, options) {
	var beatmap = parser.parseContent(osu_file_contents)

	console.log(beatmap);
	console.log(options);

	if (options.song === "") {
		if (beatmap.Title !== "" || beatmap.Title !== undefined) {
			options.song = beatmap.Title;
		} 
		if (options.song === undefined) {
			options.song = "songName";
		}
	}
	if (options.bpm === "") {
		options.bpm = beatmap.bpmMax;
	}
	
	options.bpm = parseInt(options.bpm);
	
	if (isNaN(options.bpm)) {
		options.bpm = 120;
	}
	
	if (options.time_signature === "") {
		options.time_signature = {"numerator":beatmap.timingPoints[0].timingSignature, "denominator":4};
	}
	else {
		var time_sig_split = options.time_signature.split("/")
		options.time_signature = {"numerator":time_sig_split[0], "denominator":time_sig_split[1]};
	}

	var beatUnitInMs = ((60 / options.bpm) * 1000); // beat unit length in ms (denominator)
	
	append_to_output(`{\n\t"songId": "${options.song}",`)
	append_to_output(`\n\t"bpm": ${options.bpm},`);
	append_to_output(`\n\t"timeSignature": {\n\t\t"beatsPerBar": ${options.time_signature.numerator},\n\t\t"beatUnit": ${options.time_signature.denominator}\n\t},`)
	// append_to_output(`\n\t"resolution": 16,`)
	append_to_output(`\n\t"notes": [`)
	
	// Handling of per-note output
	for (var i = 0; i < beatmap.hitObjects.length; i++) {
		if (i == 0) { append_to_output(`\n\t\t{`); }
		else 		{ append_to_output(`,\n\t\t{`); }
		
		var currentObj = beatmap.hitObjects[i];
		var beat = Math.round((currentObj.startTime / beatUnitInMs) * 100) / 100;
		var lane = hitobj_x_to_track_number(currentObj.position.get("x"));
		var noteType = "";
		var duration = "";
		
		if (currentObj.objectName == "circle") {
			noteType = "Tap";
		}
		else {
			noteType = "Hold";
		}
		
		append_to_output(`\n\t\t\t"beat": ${beat},\n\t\t\t"lane": ${lane},\n\t\t\t"noteType": "${noteType}"`);
		
		if (noteType == "Hold") {
			duration = Math.round(((currentObj.endTime / beatUnitInMs) - beat ) * 100) / 100;
			append_to_output(`,\n\t\t\t"duration": ${duration}`);
		}
		
		append_to_output(`\n\t\t}`);
	}
	
	append_to_output(`\n\t]\n}`);

	return toOutput
})
