# webapps-calculator

A calculator application with usual mathematical features, extendable function support and unit conversion.

```Example
mem = "" + si(non & vide, heure("22:21:20") + 0x14, 6² + √0b100100)
```

## Présentation

Cette application écrite en HTML5, JavaScript et CSS3 vous donnera accès à une calculatrice directement dans votre navigateur.

Les liens suivants ont été utiles pour cette application :

- [Parsing Expressions by Recursive Descent](https://www.engr.mun.ca/~theo/Misc/exp_parsing.htm), un formidable article qui propose une méthode simple à implémenter pour créer un parseur... et qui a mené à l'écriture du parseur utilisé ici.
- [jsep](https://github.com/soney/jsep), pour JavaScript Expression Parser, sous licence MIT, qui été utilisé jusqu'au 22/05/2016 pour l'analyse des formules. L'API comme le code sont simples à comprendre.
- [jQuery 3.5.0](https://jquery.com/) sous licence MIT
- [moment.js 2.24.0](https://momentjs.com/) sous licence MIT
- [ECB](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) qui utilisé dans le convertisseur monétaire pour obtenir des taux de change quotidien
- [DryIcons](https://dryicons.com/) pour le favicon

L'application devrait fonctionner correctement est mode déconnecté grâce aux **Service Workers** sous Chrome, Firefox et [d'autres](https://caniuse.com/#search=service+worker).
Plus d'infos chez [Google](https://developers.google.com/web/fundamentals/primers/service-workers/) ou [Mozilla](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

## Captures d'écran

### Présentation de l'IHM

![Présentation de l'IHM](./screenshots/webapps-calculator-1.png)

### Utilisation du convertisseur (monétaire par l'exemple)

![Présentation de l'IHM](./screenshots/webapps-calculator-2.png)

### Accès aux fonctions avancées

![Présentation de l'IHM](./screenshots/webapps-calculator-3.png)

## Liens autres

- [Conversion d'unités sur Wikipedia FR](https://fr.wikipedia.org/wiki/Conversion_des_unit%C3%A9s), qui a aidé à alimenter les unités utilisées par la fonction de conversion
- [Documentation de Math chez Mozilla](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math), avec polyfill pour sinh, cosh, tanh, asinh, acosh, atanh, hypot, log2, log10, log1p, imul, clz32
- Recherche : http://stackoverflow.com/questions/1823612/lexer-written-in-javascript
- Recherche : http://stackoverflow.com/questions/1052470/javascript-parser-for-simple-expression
- Math.js, plus lourd que "jsep" et plus limité aux math : http://mathjs.org/download.html
- PEG.js; pour se construire des parseurs à partir de la syntaxe : http://pegjs.org/
- Tutoriel : [partie 1](http://ariya.ofilabs.com/2011/08/math-evaluator-in-javascript-part1.html), [partie 2](http://ariya.ofilabs.com/2011/08/math-evaluator-in-javascript-part-2.html) et [partie 3](http://ariya.ofilabs.com/2011/08/math-expression-evaluator-in-javascript-part-3.html)

## Licence

Ce projet est distribué sous licence MIT, reproduite dans le fichier LICENSE ici présent.

## Changelog

2016-04-25
- première version

2016-04-26
- function names and operators are case-insensitive
- press enter while input has focus to calculate
- reset success/error status when formula is cleared

2016-05-06
- correction de la precedence des opérateurs
- ajout du support multilingue, détecté par "navigator.language"
- ajout de la conversion d'unité, par exemple convert(2, "km", "m") = 1000
- ajout de la conversion monétaires, par exemple convert(2, "€", "$"), grâce à ECB
- ajout de l'opérateur "in" qui met en évidence le support des tableaux
- description math.js et PEG.js

2016-05-09
- ajout des rubriques "Accélération", "Force", "Pression", "Puissance", "Vitesse" et mise à jour de certaines autres rubriques
- renvoi vers la page Wikipedia des conversions en ne précisant que l'unité (par exemple convertir("radian"))
- ajout de noms secondaires pour les unités (par exemple masse atomique = dalton = Da = u = uma)
- intégration d'une [pull request](soney/jsep#23) pour personnaliser les "literals" (pi par exemple)
- intégration d'une [pull request](soney/jsep#27) pour corriger les opérateurs unaires
- intégration d'une [pull request](soney/jsep#17) pour permettre de saisir des nombres en héxadécimal (0x12 par exemple)
- sur le même principe, permettre de saisir des nombres en binaire (0b1100 = 12 par exemple) ou en octal (0o12 = 10 par exemple)

2016-05-22
- mise à jour de jquery 2.2.2 en 2.2.4
- mettre en cache dans localStorage les taux de change (pour le mode déconnecté)

2016-05-29
- remplacement de [JSEP](https://github.com/soney/jsep) par un parseur fait maison, construit après lecture de l'article [Parsing Expressions by Recursive Descent](https://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)

2016-05-30
- restaurer le support des chaînes de caractères (cf Literal et next())
- corriger l'affichage du résultat si "false" (n'affiche rien pour le moment)
- terminer la traduction de "calculator.js" en anglais
- amélioration de "calculator.format" pour que les littéraux reprennent la valeur saisie telle quelle

2016-06-04
- correction d'un bug sur l'évaluation de littéraux que Javascript assimile à faux (le nombre 0, le texte vide)
- homogénéisation du clavier de la calculatrice avec les opérateurs et fonctions du calculateur
- ajout de "1/x" (inverse), "e" (Euler's number), "³" (cubic), "cbrt" (cubic root), "!" (factorielle) et "atan2" (atan2(x, y) = atan(x/y))

2016-06-28
- ajout du fichier LICENCE

2016-06-30
- amélioration de la gestion des erreurs : traduction des messages et remontée de la position
- correction d'un bug pour ne pas planter lorsque localStorage n'est pas défini

2016-07-02
- laisser à l'utilisateur le choix de l'URL utilisée pour les taux de change

2017-05-01
- utilisation de Promise pour les calculs afin de permettre l'intégration de fonctions asynchrones, comme par exemple pour la conversion monétaire
- réorganisation du code pour la fonction de conversion, notamment pour la partie concernant les conversions monétaires
- suppression des liens vers Wikipédia (fonction obscure et en plus vers Wikipédia FR uniquement)

2017-05-04
- ajout du support des dates et/ou des heures (nécessite "moment.js")
- réécriture de l'interprétation des littéraux (suite à l'ajout des dates/heures)
- correction de la gestion des paramètres optionnels "undefined" dans "eval" et "evalAll"
- correction de la traduction des opérateurs car ce sont des mots réservés de la syntaxe

2017-05-06
- ajout du support des tableaux vides
- ajout du support des fonctions sans paramètre
- correction de la mise en cache cassée suite à l'ajout de "moment"
- mise à jour des screenshots

2017-05-08
- inversion de la déclaration des opérateurs dans "addDefaultOperators" pour éviter la valeur de "precedence" en dur
- correction de typo

2017-05-09
- suppression des Promise (introduites le 01/05) au profit de callback pour les 2 raisons suivantes :
1. les Promise ne sont pas supportées par IE
2. les Promise ne sont pas synchrones, même si tout le contenu de la formule est synchrone
- personnalisation possible des formats de dates et heures de Calculator via "dateFormat", "timeFormat" et "datetimeFormat"
- optimisation des opérateurs && et || pour s'arrêter dès que possible (un "false" pour && ou un "true" pour ||)

2017-05-19
- ajout du support des variables (en fait des littéraux donc "value" est accessible via getter / setter au lieu d'une valeur fixe)
- ajout d'une variable "mem" pour conserver (via "MS") ou récupérer (via "MR") une valeur en mémoire dans la calculatrice
- correction des opérateurs "=" (affectation), "++" et "--" (postfix ou prefix) qui manipulent des variables
- support de la flèche vers le haut pour éditer la formule précédemment calculée

2017-05-21
- mise à jour de jQuery (2.2.4 en 3.2.1) et moment.js (2.15.0 en 2.18.1)

2017-05-30
- création des méthodes addLiteralEntry, addFunctionEntry et addOperatorEntry pour pouvoir créer soit-même les littéraux, fonctions et opérateurs sans connaître le fonctionnement interne de Calculator

2017-07-15
- correction d'un bug dans l'exécution des fonctions sans paramètre (calculator.evalAll ne répondait pas)
- préparation en amont du code de détection des valeurs (texte, date, heure, nombre, nombre au format héxadécimal, ...)
- ajout d'une méthode "formatDate(date, format)" pour tester les dates, heures et texte (ex: formatDate("2017/07/16 16:23", "MM/DD/YYYY hh:mm a"))

2017-09-12
- intégration de Node.js, Grunt et JSHint pour améliorer le code JS
- changement de "eval" en "calculate" pour éviter les warning de JSHint "eval can be harmful."
- changement de "evalAll" en "calculateAll" par cohérence par "eval"=>"calculate"

2018-02-21
- 2 contributions de [jsaintyv](https://github.com/jsaintyv)
- ajout des méthodes "reduce" et "reduceAll" pour simplifier les expressions
- ajout de l'option "dateUtc" pour choisir entre "moment(...)" ou "moment.utc(...)"

2018-04-07
- mise à jour de jQuery (3.2.1 en 3.3.1) et Moment.js (2.18.1 en 2.21.0)
- utilisation des Service Workers pour la mise en cache au lieu de [Application Cache](https://developer.mozilla.org/fr/docs/Utiliser_Application_Cache)
- création de la classe CalculatorTree pour formaliser le résultat de Calculator.parse

2018-04-08
- correction des expressions rationnelles pour préciser le début et la fin de l'expression
- correction d'un warning sous Edge sur la fermeture du tag "input"
- traduction du placeholder en haut : "Calculator" (anglais) ou "Calculatrice" (français)
- abandon de "keyCode" (IE <= 8). NB: pas de passage sur ".key" car hétérogène : Edge=Up, Firefox=ArrowUp par exemple)

2018-04-13
- ajout des CalculatorType pour permettre de choisir les types de données supportées par le calculateur
- renommage de CalculatorTree.type en CalculatorTree.kind suite à l'ajout des CalculatorType
- suppression de "checkReady", "literalTypes", "dateUtc", "dateFormat", "timeFormat" et "datetimeFormat" qui ne servent plus
- amélioration des commentaires
- amélioration de Calculator.reduce (plus courte mais devrait de toute façon bientôt disparaître)
- modification des types "date", "time" et "datetime" pour manipuler des objets {[year,month,date],[hour,minute,second]} au lieu de moment
- ajout de CalculatorType.check pour déterminer le type d'une valeur et la formatter correctement
- ajout de CalculatorLiteral.type pour associer un type à chaque valeur (NB: dans le cas de 'mem', le type change dynamiquement)

2018-08-25
- correction de la détection de la langue ("navigator.language" peut faire plus de 2 caractères, comme "fr-FR" par exemple)
- mise à jour de Moment.js 2.21.0 vers 2.22.2

2018-08-26
- passage des liens externes en HTTPS

2018-08-28
- correction pour compatibilité avec IE11+

2018-08-31
- fusion de "calculate" et "reduce"
- ajout de CalculatorFunction.reduce pour que les fonctions puissent contrôler le calcul ou non des sous-noeuds
  - pour les cas fonctions simples, la méthode "CalculatorFunction.defaultReduce" génèrera "reduce" à partir d'une fonction plus simple "calculate"
- ajout de CalculatorOperator.reduce pour pouvoir contrôler le calcul ou non des sous-noeuds et accéder aux variables en cas d'affectation
  - pour les cas fonctions simples, les 3 méthodes "CalculatorOperator.default***Reduce" génèreront "reduce" à partir d'une fonction plus simple "calculate"
- ajout de CalculatorTree.source pour remplacer CalculatorTree.literal et pour pointer aussi sur l'opérateur ou la fonction associé
- ajout des méthodes CalculatorTree.new* pour montrer les différents types de noeud que l'on peut créer (constante, litéral, fonction, groupe, ...)
- modification de Calculator.reduce pour renvoyer un CalculatorTree, plus complet qy'une valeur brute dont on ne connait pas le type
- modification de CalculatorLiteral.type pour pointer dorénavant sur l'objet CalculatorType et non plus le nom du type
- suppression de CalculatorType.check devenu inutile puisque l'on n'a plus besoin de retrouver le type à partir de la valeur
- suppression de Calculator.calculate et Calculator.calculateAll. Utiliser Calculator.reduce à la place
- correction du formatage des valeurs < 0 en héxadécimal, octal et binaire

2019-02-17
- ajout des fonctions "year", "month", "date", "hour", "minute" et "second" ("année", "mois", "jour", "heure", "minute", "seconde" en "français")
- modification des dates/heures pour prendre en compte les secondes par défaut ("lang" permet de personnaliser ce point, comme la calculatrice qui zappe les secondes en datetime)
- modification du choix UTC ou non en passant le constructeur "moment" ou "moment.utc" aux types "date", "time", "datetime" et à la fonction "formatDate" plutôt que de forcer UTC
- remplacement de CalculatorLiteral.value par 2 fonctions CalculatorLiteral.getValue(context) et CalculatorLiteral.setValue(context, newValue)
- CalculatorLiteral peut maintenant éviter les variables globales et ainsi, à moyen terme, permettra de lancer en parallèle plusieurs calculs
- correction de CalculatorFunction.defaultReduce qui retournait parfois des CalculatorTree.newBinary au lieu de CalculatorTree.newFunction
- correction de quelques passage de "reject" oubliés lors des appels à context.reduce et context.reduceAll
- correction de "addDefaultFunctions" pour accélérer la recherche du type approprié
- correction de la calculatrice qui lançait une erreur si on demandait le calcul d'une formule vide
- mise à jour du CHANGELOG dans README.md

2019-02-22
- création de CalculatorContext pour formaliser cette notion nécessaire pour implementer correctement CalculatorLiteral, CalculatorFunction et CalculatorOperator
- correction de "addDefaultFunctions" qui utilisait une variable "nullType" non définie
- documentation de méthodes oubliées dans CalculatorFunction, CalculatorOperator et CalculatorTree
- mise à jour de LICENCE pour 2019

2019-05-01
- correction du traitement des opérateurs 'postfix' car 2² fonctionnait mais pas (1+1)²
- encapsulation du code du calculateur dans "loadCalculatorAPI", permettant l'activation de "use strict" et le choix des méthodes exportées
- correction de l'URL et simplification du code de récupération des taux de change vers l'euro

2020-03-06
- mise à jour des modules Node pour "jshint"

2020-04-15
- mise à jour de jQuery (3.5.0) et Moment (2.24.0)
- ajout de l'opérateur javascript "??"
- correction de la précédence de l'opérateur "**"
- correction du type décimal pour autoriser .2 par exemple pour signifier 0.2
- intégration dans l'IHM des éléments de syntaxes manquants (++, --, =, année, mois, jour, heure, minute, seconde)