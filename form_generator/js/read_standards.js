
import { generate_decision_message_block } from './UIInteractionHandlers.js';
import { readSpecificEmpiricalStandard } from './ReadEmpiricalStandards.js';
import { create_requirements_checklist } from './RequirementsChecklist.js';
import { populate_checklist } from './PopulateChecklist.js';

// Variables for the Checklist
let role = getParameterByName('role');

all_intro_items = "";
all_method_items = "";
all_results_items = "";
all_discussion_items = "";
all_other_items = "";
unrecognized_tags = "";
standards_with_no_tags = "";
standards_with_untagged_attributes = "";

//This function reads in the file name and passes it onto the next method
function getParameterByName(param_name, url = window.location.href) {
	var params = location.search && location.search.substr(1).replace(/\+/gi, " ").split("&");
	var param_values = [];
	var i = 0;
	for (var param_index in params) {
		var param = params[param_index].split("=");
		if (param[0] === param_name) {
			param_values[i] = param.length > 1 ? "\"" + unescape(param[1]) + "\"" : "noval";
			i++;
		}
	}
	return param_values;
}


// TODO: Not used anywhere, can be removed, verify with Erin before removal.
function generate_question_block_without_yes_no_radio_answers(id, class_name, question, checklistItem_id, padding) {
	var question_block = document.createElement("div");

	question_block.id = id + ":" + checklistItem_id;
	question_block.className = "question_block";
	question_block.style = "padding-left:" + padding + "em; display:none";

	return question_block;
}

// sorting all the standards, engineering research and mixed methods always displayed before any other standards regardless of any input
function sortStandards(keys) {
	var sorted_keys = [];
	if (keys.includes("\"Engineering Research\"")) {
		sorted_keys.push("\"Engineering Research\"")
		keys.splice(keys.indexOf("\"Engineering Research\""), 1);
	}
	if (keys.includes("\"Mixed Methods\"")) {
		sorted_keys.push("\"Mixed Methods\"")
		keys.splice(keys.indexOf("\"Mixed Methods\""), 1);
	}
	sorted_keys = sorted_keys.concat(keys.sort());
	return sorted_keys;
}

// Create Role Heading (Pre-Submission Checklist, Reviewer Checklist)
function create_role_heading() {
	var heading_div = document.createElement("div");
	var heading = document.createElement("H1");

	if (role == "\"author\"") {
		heading.innerHTML = "Pre-Submission Checklist";
		heading_div.appendChild(heading);

		var instructions = document.createElement("h3");
		instructions.innerHTML = "Use this form to ensure your manuscript meets the appropriate standards. You can download the results to share with reviewers so they can see where you have addressed each item.";

		heading_div.appendChild(instructions);

	} else if (role == "\"one-phase-reviewer\"") {
		heading.innerHTML = "Reviewer Checklist";
		heading_div.appendChild(heading);

	} else if (role == "\"two-phase-reviewer\"") {
		heading.innerHTML = "Reviewer Checklist";
		heading_div.appendChild(heading);
	}

	return heading_div;
}

// Create a message showing the loaded configuration
function create_load_config_msg() {
	var config = document.createElement("p");
	config.innerHTML = "Customized Configuration Loaded";
	config.className = "hide_display";
	return config;
}

// Save checklist state on visibility change
document.addEventListener("visibilitychange", () => {
	console.log("Storing checklist items.");
	let items = document.querySelectorAll("#checklists ul ul li");

	for (let item of items) {
		let storage = {};
		let key = role + "-" + item.className;

		if (role != "\"author\"") {
			if (item.children[0].checked) {
				storage.checked = true;
				localStorage.setItem(key, JSON.stringify(storage));
			} else if (item.children[1].checked) {
				storage.checked = false;

				let question_blocks = item.getElementsByClassName('question_block');
				let reasonable_yes = question_blocks[0].getElementsByClassName('deviationRadioYes')[0];
				let reasonable_no = question_blocks[0].getElementsByClassName('deviationRadioNo')[0];

				if (reasonable_yes.checked) {
					storage.reasonable = true;

				} else if (reasonable_no.checked) {
					storage.reasonable = false;

					let types = question_blocks[1].getElementsByClassName('justificationRadioType');
					if (types[0].checked) {
						storage.deviationType = 1;
					} else if (types[1] && types[1].checked) {
						storage.deviationType = 2;
					} else if (types[2] && types[2].checked) {
						storage.deviationType = 3;
					} else if (types[3] && types[3].checked) {
						storage.deviationType = 4;
					}

					let free_text = item.getElementsByClassName('question_block_free_Text')[0];
					let free_text_content = free_text.getElementsByClassName('freeTextAnswer')[0];

					if (free_text_content.value != "") {
						storage.freeText = free_text_content.value;
					}
				}
				localStorage.setItem(key, JSON.stringify(storage));
			} else if (item.className.includes("Desirable") || item.className.includes("Extraordinary")) {
				if (!item.children[0].checked) {
					localStorage.removeItem(key, "");
				}
			}
		} else {
			let location_box = item.getElementsByClassName('item_location_textbox')[0];
			let missing_button = item.getElementsByClassName('missing_checkbox')[0];

			if (location_box.value != "") {
				storage.location = location_box.value;
				localStorage.setItem(key, JSON.stringify(storage));

			} else if (missing_button.checked) {
				storage.location = false;

				let justification_box = item.getElementsByClassName('justification_location_textbox')[0];
				let justification_button = item.getElementsByClassName('unjustified_checkbox')[0];

				if (justification_box.value != "") {
					storage.justified = justification_box.value;

				} else if (justification_button.checked) {
					storage.justified = false;
				}
				localStorage.setItem(key, JSON.stringify(storage));
			}
		}
	}
});

// Add the bottom of checklist "For more information, see: "
function create_for_more_info_part(standard_keys) {
	var more_info_DIV = document.createElement("DIV");
	var more_info_H2 = document.createElement("H2");
	more_info_H2.innerHTML = "For more information, see:";

	var standards_path = "../docs/standards?standard="
	var more_info_UL = document.createElement("UL");

	// Adding Standards as a list with a link to the correct page
	for (let key of standard_keys) {
		key = key.replaceAll("\"", "");
		var LI = document.createElement("LI");
		var LINK = document.createElement("A");
		LINK.innerHTML = key;
		LINK.href = standards_path + key.replaceAll(" ", "");
		LINK.target = "_blank";
		LINK.className = "standard_links";
		LI.appendChild(LINK);
		more_info_UL.appendChild(LI);
	}
	more_info_DIV.appendChild(more_info_H2);
	more_info_DIV.appendChild(more_info_UL);
	return more_info_DIV;
}

// Functions below are directly accessed by the UI Files
function generateStandardChecklist(file) {
	console.log(file);

	// list of Standards
	standard_keys = getParameterByName('standard');

	// return sorted list of Standards
	standard_keys = sortStandards(standard_keys);

	var wrappers = document.getElementsByClassName('wrapper');
	var wrapper = null;
	if (wrappers.length > 0)
		wrapper = wrappers[1];

	// Create container that holds header, checklist, etc.
	var container = document.createElement("DIV");
	container.id = "container";

	// Create header (Pre-submission Checklist, Reviewer Checklist)
	var heading = create_role_heading();

	// Create a message showing the loaded configuration
	var config = create_load_config_msg();

	// Create Checklist
	var form = create_requirements_checklist(file);

	// Append header and form to container
	container.appendChild(heading);
	container.appendChild(config);
	container.appendChild(form);

	// Creates line separating from checklist and "for more information, see:"
	HR = document.createElement("HR");
	container.appendChild(HR);

	// Create "For more information, see:"
	var more_info_DIV = create_for_more_info_part(standard_keys);
	container.appendChild(more_info_DIV);

	if (wrapper == null) {
		document.body.appendChild(container);
	} else {
		wrapper.appendChild(container);
	}

	//This function is primarily responsible for controlling the displaying of the deviation blocks in the checklist.
	generate_decision_message_block();

	// Check if the current checklist is being stored
	if (localStorage.getItem(role) !== null) {
		console.log(role + " checklist found in storage");
		populate_checklist();
	} else {
		console.log("Begin storing " + role + " checklist");
		localStorage.setItem(role, "");
	}
}

function viewStandardDescription(standard_name) {
	// Obtain all the information for a Standard
	empirical_standard = readSpecificEmpiricalStandard(standard_name);
	var dom = document.createElement("div");
	dom.innerHTML = empirical_standard;
	var standardTag = dom.getElementsByTagName("standard")[0];
	var descTags = standardTag.getElementsByTagName("desc");
	for (let descTag of descTags) {
		descHTML = descTag.innerHTML.replaceAll(">", "").replaceAll(/\n\s*\n/g, '\n').replaceAll("\n", " ").replaceAll("*", "");
	}
	return descHTML;
}