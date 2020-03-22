'use strict';
var learnjs = {
  poolId: 'us-east-1:83b1bd5e-ca12-4d57-83c5-c717fa149364'
};
learnjs.identity = new $.Deferred();

learnjs.template = function(name){
  return $('.templates .' + name).clone();
}

learnjs.landingView = function(){
  return learnjs.template('landing-view');
}

learnjs.buildCorrectFlash = function(problemNum){
  var correctFlash = learnjs.template('correct-flash');
  var link = correctFlash.find('a');
  if(problemNum < learnjs.problems.length){
    link.attr('href', '#problem-' + (problemNum + 1));
  }else{
    link.attr('attr', '');
    link.text("You're Finished!");
  }
  return correctFlash;
}

//問題&回答入力部分のView
learnjs.problemView = function(data){
  var problemNumber = parseInt(data, 10);
  
  var view = learnjs.template('problem-view');
  var problemData = learnjs.problems[problemNumber - 1];
  var resultFlash = view.find('.result');
  if(problemNumber < learnjs.problems.length){
    var buttonItem = learnjs.template('skip-btn');
    buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
    $('.nav-list').append(buttonItem);
    view.bind('removingView', function(){
      buttonItem.remove();
    });
  }
  function checkAnswer(){
    var answer = view.find('.answer').val();
    var test = problemData.code.replace('__', answer) + '; problem();';
    return eval(test);
  }

  function checkAnswerClick(){
    if(checkAnswer()){
      var correctFlash = learnjs.template('correct-flash');
      learnjs.flashElement( resultFlash, learnjs.buildCorrectFlash(problemNumber));
    }else{
      learnjs.flashElement( resultFlash, 'Incorrect!');
    }
    //ページリロードの防止
    return false;
  }
  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
}

//url hashによるrouting
learnjs.showView = function(hash){
  var routes = {
    '#problem' : learnjs.problemView,
    '#': learnjs.landingView,
    '' : learnjs.landingView,
  };
  var hashParts = hash.split('-');
  var viewFn = routes[hashParts[0]];
  if(viewFn){
    learnjs.triggerEnvent('removingView', []);
    $('.view-container').empty().append(viewFn(hashParts[1]));
  }
}

learnjs.applyObject = function(obj, elem){
  for(var key in obj){
    elem.find('[data-name="' + key + '"]').text(obj[key]);
  }
}

learnjs.flashElement = function(elem, content){
  elem.fadeOut('fast', function(){
    elem.html(content);
    elem.fadeIn();
  });
}

learnjs.triggerEnvent = function(name, args){
  $('.view-container>*').trigger(name, args);
}

learnjs.problems = [
  {
    description: "What is truth?",
    code: "function problem(){ return __; }"
  },{
    description: "Simple Math",
    code: "function problem(){ return 42 === 6 * __; }"
  }
]

learnjs.appOnReady = function(){
  window.onhashchange = function(){
    learnjs.showView( window.location.hash );
  };
  learnjs.showView( window.location.hash );
}
learnjs.awsRefresh = function(){
  var deferred = new $.Deferred();
  AWS.config.credentials.refresh(function(err){
    if(err){
      deferred.reject(err);
    }else{
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });
  return deferred.promise();
}

function googleSignIn(googleUser) {
  console.log(googleUser.getAuthResponse());
  var id_token = googleUser.getAuthResponse().id_token;
  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: learnjs.poolId,
      Logins: {
        'accounts.google.com': id_token
      }
    })
  });
  function refresh(){
    return gapi.auth2.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function(userUpdate){
       var creds = AWS.config.credentials;
       var newToken = userUpdate.getAuthResponse().id_token;
       creds.params.Logins['accounts.google.com'] = newToken;
       return learnjs.awsRefresh();
    });
  }
  learnjs.awsRefresh().then(function(id){
    console.log(id);
    learnjs.identity.resolve({
      id: id,
      email: googleUser.getBasicProfile().getEmail(),
      refresh: refresh
    });
  });
}