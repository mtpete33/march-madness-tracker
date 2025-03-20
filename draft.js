
$(document).ready(function() {
    $.getJSON('draft_order.json', function(data) {
        const container = $('#draft-container');
        
        data.draft_order.forEach(round => {
            const roundDiv = $('<div>').addClass('round-container');
            roundDiv.append($('<h2>').addClass('round-title').text(`Round ${round.round}`));
            
            round.picks.forEach(pick => {
                const pickDiv = $('<div>').addClass('pick');
                pickDiv.append($('<span>').addClass('pick-number').text(pick.pick_number));
                pickDiv.append($('<span>').addClass('drafter').text(pick.drafter));
                pickDiv.append($('<span>').addClass('team').text(pick.team_selected));
                roundDiv.append(pickDiv);
            });
            
            container.append(roundDiv);
        });
    });
});
