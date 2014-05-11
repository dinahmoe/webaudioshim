// https://developer.mozilla.org/en-US/docs/Web_Audio_API/Porting_webkitAudioContext_code_to_standards_based_AudioContext

window.AudioContext = window.AudioContext || window.webkitAudioContext || null;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext || null;

(function (Context) {
	var isFunction = function (f) {
		return Object.prototype.toString.call(f) === "[object Function]" ||
			Object.prototype.toString.call(f) === "[object AudioContextConstructor]";
	};

	if (!isFunction(Context)) {
		return; // no audio context
	}

	var instance = new Context();
	if (!instance.destination || !instance.sampleRate) {
		return;
	}
	
	var sourceProto = Object.getPrototypeOf(instance.createBufferSource());
	if (!isFunction(sourceProto.start)) {
		if (isFunction(sourceProto.noteOn)) {
			sourceProto.start = function (when, offset, duration) {
				switch (arguments.length) {
					case 0:
						throw new Error("Not enough arguments.");
					case 1:
						this.noteOn(when);
						break;
					case 2:
						if (this.buffer) {
							this.noteGrainOn(when, offset, this.buffer.duration - offset);
						} else {
							throw new Error("Missing AudioBuffer");
						}
						break;
					case 3:
						this.noteGrainOn(when, offset, duration);
				}
			};
		}
	}

	if (!isFunction(sourceProto.noteOn)) {
		sourceProto.noteOn = sourceProto.start;
	}

	if (!isFunction(sourceProto.noteGrainOn)) {
		sourceProto.noteGrainOn = sourceProto.start;
	}

	if (!isFunction(sourceProto.stop)) {
		sourceProto.stop = sourceProto.noteOff;
	}

	if (!isFunction(sourceProto.noteOff)) {
		sourceProto.noteOff = sourceProto.stop;
	}

	/// Changes to some of the enumerated values in the API
	var enumerate = function(fn, from, to) {
		var filter = Object.getPrototypeOf(instance[fn]());
		if (typeof(filter[from[0]]) === "undefined") {
			for (var n = 0; n < from.length; n ++) {
				var method1 = from[n];
				var method2 = to && to[n] || method1;
				filter[method1] = method2.toLowerCase();
			}
		}
	};
	enumerate("createBiquadFilter", ["LOWPASS", "HIGHPASS", "BANDPASS", "LOWSHELF", "HIGHSHELF", "PEAKING", "NOTCH", "ALLPASS"]);
	enumerate("createOscillator", ["SINE", "SQUARE", "SAWTOOTH", "TRIANGLE", "CUSTOM"]);
	enumerate("createPanner", ["EQUALPOWER", "HRTF", "LINEAR_DISTANCE", "INVERSE_DISTANCE", "EXPONENTIAL_DISTANCE"], ["equalpower", "HRTF", "linear", "inverse", "exponential"]);

	/// Changes to the creator functions
	[
		["createGainNode", "createGain"],
		["createDelayNode", "createDelay"],
		["createJavaScriptNode", "createScriptProcessor"],
		["createWaveTable", "createPeriodicWave"]
	].forEach(function (names) {
		var name1;
		var name2;
		while (names.length) {
			name1 = names.pop();
			if (isFunction(this[name1])) {
				this[names.pop()] = this[name1];
			} else {
				name2 = names.pop();
				this[name1] = this[name2];
			}
		}
	}, Context.prototype);
})(window.AudioContext);