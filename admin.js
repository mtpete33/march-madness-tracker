$(document).ready(function() {
    let draftData = {};

    // Load draft data
    function loadDraftData() {
        $.getJSON('draft.json', function(data) {
            draftData = data;
            updateUI();
        });
    }

    // Update UI with current data
    function updateUI() {
        // Populate family member dropdown
        const select = $('#familyMemberSelect');
        select.empty().append('<option value="">Select Family Member</option>');
        draftData.family_members.forEach(member => {
            select.append(`<option value="${member.name}">${member.name}</option>`);
        });

        // Show current assignments
        const container = $('#assignments-container');
        container.empty();
        draftData.family_members.forEach(member => {
            const memberTeams = member.teams.join(', ') || 'No teams assigned';
            container.append(`
                <div class="member-teams">
                    <h3>${member.name}</h3>
                    <p>${memberTeams}</p>
                </div>
            `);
        });
    }

    // Add team to family member
    $('#teamForm').submit(function(e) {
        e.preventDefault();
        const memberName = $('#familyMemberSelect').val();
        const teamName = $('#teamInput').val().trim();

        if (!memberName || !teamName) {
            alert('Please select a family member and enter a team name');
            return;
        }

        const member = draftData.family_members.find(m => m.name === memberName);
        if (member.teams.length >= 8) {
            alert('This member already has 8 teams assigned');
            return;
        }

        member.teams.push(teamName);

        // Save updated data
        $.ajax({
            url: '/updateDraft',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(draftData),
            success: function() {
                $('#teamInput').val('');
                loadDraftData();
            },
            error: function() {
                alert('Error saving data');
            }
        });
    });

    // Initial load
    loadDraftData();
});