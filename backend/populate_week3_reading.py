"""Script to populate Week 3 assignment with reading text"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Assignment

load_dotenv()

WEEK3_READING_TEXT = """Reading Revolutionaries  Joseph F. Tiedemann  Historians have long been at pains to explain why New York
was the last of the thirteen colonies to declare its independence from
Great Britain, in 1776. New York City is especially perplexing, for a dec-
ade earlier the opposition of its residents to the Stamp Act had brought
the city to the brink of rebellion.
For months, in 1765, partisans had been erecting the stage and collect-
ing the props for the street theater that was to commence as soon as
the hated stamp tax became effective, on Friday, November 1. Lt. Gov.
Cadwallader Colden, an overzealous royal appointee, had been busy since
July readying Fort George, at the southwest tip of Manhattan Island, to
withstand a mob's assault. And a "secret unknown party" opposed to the
tax had been predicting violence for almost as long. Local patricians knew
tumult was inevitable, but the violent tremor that struck on that Friday
shook their confidence and convinced them that anarchy had engulfed
New York.'
The actual drama had begun on Thursday, the day before the Stamp
Act was to take effect. After merchants voted to boycott British imports,
dissidents roamed the streets, shouting "Liberty" and breaking "thou-
sands of windows."? Rumor had it that Maj. Thomas James, a British offi-
cer who had bragged that he would "cram the Stamps down their
Throats," was to be buried alive." Tension mounted on Friday. As soldiers
prepared for the mob's onslaught, marines from warships in the harbor
took up defensive positions inside the fort. Garden fences and other
structures outside its walls were leveled so that "the Great Guns might
play the more freely." And the cannons were loaded with grape shot for
greater eftect against the mob. Meanwhile, Colden received a note pre-
dicting his death if redcoats dared to fire their weapons during the up-
coming protests.*
At nightfall two crowds formed, ostensibly "in defence of his Majesty's
person and government." The first met in the town Commons and built
a movable gallows from which they hung an effigy of Colden. On his back
was a drum, an allusion to a canard that he had been a drummer in the
army of the Pretender in Scotland; on his breast was a sign inscribed " The
Rebel Drummer in the Year 1715." Like the Pretender, who had lost his
claim to the throne because of Stuart pretensions to absolutism, Colden
epitomized the popular fear of arbitrary government. By assailing him the
crowd was affirming its loyalty to George III yet subtly admonishing the
king that he too would forfeit his crown if he tried to establish a tyranny.
The second group paraded by candlelight through the streets with its own
effigy of Colden, ridiculing him in the same fashion residents mocked
criminals and scoundrels. When city magistrates halted the demonstrators
and threw their dummy to the ground, mob leaders "ordered it to be
taken up again in the most Magisterial manner, and told the Mayor etc,
they would not hurt them, provided they stood out of their way." The
officials complied, and the crowd proceeded "with the greatest order."
The group finally reached Fort George, and Colden's effigy "was brought
up within 8 or 10 feet of the Fort Gate with the grossest ribaldry from the
Mob." The protesters brazenly broke open the governor's coach house
and seized Colden's carriage. They then seated the dummy in the coach
and drew it to the Coffee House, where merchants applauded the spec-
tacle.
This second crowd then moved uptown to join the first. Now two thou-
sand strong, the crowd returned to the fort, where rioters hurled bricks
and stones over the walls. Some even put their hands atop the ramparts,
taunting the troops to fire. Luckily, no one did. Three hundred carpen-
ters stood ready to cut down the fort gate at the first shot, and four hun-
dred seamen were waiting to charge through the opening. A mob leader
finally intervened, and the rioters regrouped at Bowling Green, where
they burned the lieutenant governor's effigy, gallows, and carriage.
"While this was doing," said Colden, "a great number of Gentlemen...
observe[d] this outrage on their King's Governor." When the church
bells tolled, the crowd carried off the remains for burial,® and the city's
patricians assumed the affair was over. But while spectators were still
watching the fire, a "Detachment of Volunteers" had slipped off to Major
James's newly refurbished mansion. Imitating what a Boston mob had
done to Lt. Gov. Thomas Hutchinson's home in August, the New York
rioters "brought out of his house al they could find, drank his liquors,
and burnt and destroyed everything else before the door." They then
"beat to Pieces all the Doors, Sashes, Window Frames and Partitions in
the House, leaving it a mere Shell. "g
The violence that residents employed in 1765 to dissuade royal officials
from enforcing the Stamp Act burnished the city's reputation throughout
the thirteen colonies. But a decade later whigs (or patriots) all over
America were bemoaning the ambivalence with which New Yorkers were
defending their rights against British tyranny. In June 1775, for example,
the Provincial Congress, which was acting as New York's extralegal government, learned that Gen. George Washington, the American army's newly
appointed commander-in-chief, planned to visit town. Patriots wanted to
give him a welcome befitting his rank, and the Provincial Congress or-
dered Col. John Lasher's newly uniformed battalion to act as honor
guard. Congress soon found itself in an awkward spot, however. Early on
June 25, it learned that Washington and the colony's British governor,
William Tryon, who had been overseas, would both be arriving in town
that same day. Lasher's orders were promptly changed. He was to station
one company at Paulus Hook, across the Hudson in New Jersey, to greet
the general and another at the Ferry, in New York, to meet the governor.
The remainder of his unit was to be kept "ready to receive either the
General or Governor Tryon, which ever shall first arrive." 10
In the event, Washington was the first on the scene, arriving in New
York at four p.m. to the more lavish reception. As the loyalist (or pro-
British) historian Thomas Jones described it, "the volunteer companies
raised for the express purpose of rebellion, the members of the Provincial
Congress, those of the city committee, [and] the parsons of the dissenting
meeting-houses" met him at the beach and then dined in his honor at
Lispenard's inn. Toward evening, "nine companies of foot in their uni-
forms, and a greater number of the principle inhabitants" than had ever
before assembled escorted him to Hull's tavern, just north of Trinity
Church. Once Washington had retired for the night, onlookers could
walk the few short blocks to the foot of Broad Street, where the governor
was now ready to land. "His Majesty's Council, the Judges of the Supreme
Court, the Attorney General, the Speaker and Members of the General
Assembly then in town, the Clergymen of the Church of England, ... the
Governors of King's College, of the Hospital, the members of the Cham-
ber of Commerce, and Marine Society, with a numerous train of his Maj-
esty's loyal and well affected subjects," conducted Tryon "with universal
Shouts of applause" to a private home, where he spent the night. In the
group, said Jones, were people "who had been not five hours before pour-
ing out their adulation and flattery" to Washington. They "now one and
al joined in the Governor's train, and with the loudest acclamations, at-
tended him to his lodgings, where, with the utmost seeming sincerity,
they shook him by the hand, [and] welcomed him back to the Colony.""
That shift in behavior across so critical a decade troubled whigs
throughout America. In 1774 Joseph Reed of Pennsylvania had com-
plained of New York's leaders: "While they are attending to the little pal-
try disputes which their own parties have produced, the great cause is
suffering in their hands." In 1776 John Adams asked in exasperation,
"What is the Reason, that New York is still asleep or dead, in Politics and
War? . . . Have they no sense, no Feeling? No sentiment? No Passions?
While every other Colony is rapidly advancing, their Motions seem to be
rather retrograde."12
New York City, of course, was the key to the colony: its capital, commer-
cial entrepot, and cultural nexus. If the city submitted to British imperial-
ism, the province was likely to do so too. Moreover, the city's influence
extended even beyond the colony's borders: the New Jersey Sons of Lib-
erty were "satellites of New York, whence came inspiration and guid-
ance."8 In 1770, when the city was the first in America to rescind its
boycott agreement against the Townshend Duties, the other seaports pro-
tested bitterly yet followed suit. Given its strategic location, physically di-
viding the thirteen colonies in half, New York City was also headquarters
for the British army in America. Its harbor was the best on the East Coast,
and the Hudson River provided excellent lines of communication with
Canada and the American interior. Realistically, if Britain could hold
onto New York, the whig cause would be sorely imperiled.
What is striking, given the city's importance, is that there is no modern,
full-length history of it for the years between 1763 and 1776. The stan-
dard histories for the period are George W. Edwards, New York as an Eigh-
teenth Century Municipality, 1731-1776; Oscar Theodore Barck, Jr., New
York City during the War for Independence, Wilbur C. Abbott, New York in the
American Revolution; Thomas Jefferson Wertenbaker, Father Knickerbocker
Rebels: New York City during the Revolution; and Malcolm Decker, Brink of
Revolution: New York in Crisis, 1765-1776. The first is an institutional his-
tory; the second concentrates on the period between 1776 and 1783;
the third and fourth, which cover the entire era from 1763 to 1783, are
outdated; and the last is a narrative, rather than interpretive, work. More
recent studies have been either histories of the province, biographies of
its prominent political leaders, or studies of particular groups. These later
works have added immeasurably to our knowledge, but they have not
satisfactorily answered Adams's questions. 1*
To some historians, New Yorkers were reluctant to rebel because the
colony was a hotbed of loyalism. In 1901 Alexander Flick claimed that
even after July 4, 1776, "a majority" favored the king; "from first to last
New York city was overwhelmingly tory." In 1965 Wallace Brown stated
that New York's opposition to British initiatives after 1763 "was vocal and
vehement, but, uniquely among the colonies, remained in the hands of
moderates and future Loyalists." When "the agitation shifted to outright
war and independence, many 'Whigs' became 'Tories,' and the latter
party stood forth with a strength rarely equaled in any other part of
America."15 In 1966, however, Bernard Mason argued successfully that
"the slow maturation of the New York revolutionary party and the tortu-
ous course of the Whigs" might lead an "unwary observer" to conclude
that "the Whigs were a minority." Yet "a searching probe" of the evi-
dence proved that patriots were "a majority of the population." In 1986
Philip Ranlet estimated that "perhaps 15 percent" of New Yorkers were
loyalist (or tory), "10 percent were neutral for religious reasons or for
personal safety," and the rest "patriots of varying categories of firm-
ness." 16
But if the whigs were a majority, why were they reluctant to rebel? To
answer that question, two key historiographical traditions have emerged.!7
The first, or Progressive School of American History, which took form in
190g with the publication of Carl Becker's History of Political Parties in the
Province of New York, 1760-1776, minimized the role of ideas and stressed
class and economic issues. The Revolution resulted from "two general
movements, the contest for home-rule and independence and the democ-
ratization of American politics and society." The latter struggle, the more
paramount, pitted the few against the many, the rich against the poor,
the powerful against the impotent. The second historiographical tradi-
tion, which derives from the Consensus or neo-Conservative School of
American History, has "found broad economic and social divisions within
the colonies to have been less important" in explaining the Revolution
"than the conflicting interests and ambitions of rival groups within the
upper strata of society." 1&
Despite their profound disagreements, scholars from both schools have
focused their attention on the New York elite, arguing that it was its mem-
bers who had successfully slowed the pace toward revolution, and that
they had done so for any of several reasons: they feared losing political
power to the increasingly vocal (and violent) lower classes; they were po-
litical opportunists who were too busy exploiting the imperial crises to
[6] Introduction
their own advantage to take time for furthering the cause of liberty; or
they were too afraid for their own lives, property, and power to fight for
American constitutional rights. But such arguments leave a critical ques
tion unanswered. If New York was, as one recent historian has argued,
ready by 1774 because of internal reasons "for a thoroughgoing revolu-
tion," how was this handful of aristocrats able to confound the wil of the
people and thus to stem the tide of revolution?1ª The aim of the present
close study of New York politics, therefore, is to attempt a new synthesis
of the city's history for these years and to reconsider why New Yorkers
were reluctant to rebel.
In evaluating the causes of a revolution, scholars generally focus on
those who rebel, and on their grievances. Yet the mere existence of an
aggrieved people does not mean that a revolution will occur. Three condi-
tions must be met for conflict to emerge: the groups involved "must be
conscious of themselves as collective entities," at least one of them must
resent its position vis-à-vis the other group, and the dissatisfied party must
believe that it can remedy its situation. The question, of course, is when
does an oppressed people reach the point where they think they can bet-
ter their lot by rebelling? Walter Laqueur provided one answer in stating
that "most modern revolutions, both successful and abortive, have fol-
lowed in the wake of war," and these have taken place in both victorious
and vanquished nations. That same idea was carefully developed in 1979
in Theda Skocpol's States and Social Revolutions. She argued that regimes
have survived for long periods of time despite overwhelming popular dis-
content, even in the face of an organized opposition. For a revolution to
erupt, there must also be a crisis or breakdown in the central government,
and such a crisis is invariably brought on by international conflict. Caught
between the exigencies of war and the demands of domestic interest
groups, the government loses the ability to enforce its authority over all
or part of its subjects.20
To explain the Revolution in New York it is thus imperative to examine
what Britain was doing as well as what was happening in the city. When
Britain's role in causing the struggle is ignored, inter- and intraclass rivalr-
ies in New York appear more significant and determinative of behavior
than they actually were. When Britain's role is taken for granted, the
Anglo-American conflict mistakenly becomes of almost secondary impor-
tance in accounting for why residents acted as they did.21
Three propositions, based on Skocpol's analysis of the causes of revolu-
ton, will explain the thrust of the argument made in the pages that fol-
low.« First, the object of a government (like Great Britain's) in the mod-
ern competitive state system is to maintain domestic order and to
Introduction (7)
compete successfully against other nation-states." Second, though a gov-
emment is often assumed to be "created and manipulated" by its polity's
"dominant classes," it can also function as an "autonomous" entity that
vies with domestic interest groups for scarce resources. In particular, in-
ternational imperatives and opportunities can impel a state to pursue pol-
icies that clash with or contravene the vital interests of these same groups.
The potential for clashes of this sort was especially great in the mainland
American colonies, because of the ease with which Britain could sacrifice
important groups there in the name of the common good or for the
benefit of constituencies elsewhere in the empire.? Third, when such a
conflict emerges, a regime that can neither preserve order at home nor
adapt to the changing international situation will suffer "a loss of legiti-
macy" in the eyes of the people and will survive only if its coercive institu-
tions "remain coherent and effective." Because the American colonies
were united to the British crown by ties of affection and self-interest and
not by physical force, Britain's insistence in the 176os and 1770s on "a
full and absolute submission" to parliamentary sovereignty dramatically
increased the likelihood of revolution.25
In brief, the Seven Years' War and the needs of the competitive state
system impelled Britain to embark on three major initiatives to tax the
colonies and to exert parliamentary sovereignty over them.?6 Each at-
tempt—the first linked to the Stamp Act, the second to the Townshend
Acts, and the third to the Tea Act and the Coercive Acts-provoked a
political crisis in New York. The last finally propelled the city and province
of New York to join with the other mainland American colonies in a revo-
lution against Britain. Accordingly, this study is divided into three parts.
Each will examine what Britain did, why the city reacted as it did, and
how New York's political landscape changed as a result. In each of the
three crises the situation was complex and the conflicts multifaceted.
Where partisans stood on the local political spectrum partially deter-
mined how they responded to the imperial crises, and the steps they took
to resist Britain in turn influenced how they saw New York politics. For
instance, debating how power should be shared in the empire led people
to question how it was being exercised in the province. Nonetheless,
though the final outcome in New York cannot be explained without con-
sidering local politics, it was British imperialism, not political and eco-
nomic strains in New York, that pushed the city toward independence.
Though every historical event is unique, there are nonetheless certain
patterns of behavior that typify conflict situations. Peter Shaw and Paul A.
Gilje, for example, have each outlined the traditions that Revolutionary
Americans reflected when rioting. But because the situation in New York
(83 Introduction
City was so multidimensional, the present work also makes use of social.
conflict theory to better grasp why New York's polyglot population acted
as it did between 176g and 1776. Scholars in this field examine and com-
pare the causes, evolution, and consequences of group antagonisms to
better understand conflict as an integral and essential component of
human behavior."" The present study has relied particularly on the eight-
stage model of conflict elaborated by Louis Kriesberg, a leading prac-
titioner of this interdisciplinary approach, in his Social Conflicts. He di-
vided the process into the following stages, analytically: the bases of con-
flict; how the conflict emerges; initial conduct; escalation; deescalation;
termination; outcome; and consequences. For the sake of readability,
however, the model has not been superimposed on the text. Instead, ref-
erences to Kriesberg are limited to those contexts, in the text and the
notes, where conflict theory proves to be especially useful in illuminating
what was transpiring in a particular situation, or where the dynamics typi-
cal of a given stage of conflict clarify how participants were acting at a
comparable moment in New York City.
Employing social-conflict theory in the present work is important for
three reasons. First, comparing what happened in the city with what has
been hypothesized about the nature of conflict, both between and within
communities, makes it possible to look at Revolutionary New York from a
fresh perspective. Behavior that is puzzling when examined solely in
terms of the city's history often becomes more understandable when
viewed in the broader context of conflict theory.
Second, given New York's factious and heterogeneous population, a
social-conflict approach is especially helpful in analyzing its behavior.
Many historians recognize that the great breadth of the city's economic,
religious, cultural, and ethnic mix of peoples enlivened its colonial his-
tory and fostered the emergence of a sophisticated political culture."
Some have argued, too, that this same diversity shaped how the city re-
acted to the coming of the Revolution, though no one has detailed ex-
actly how.3 Social-conflict theory helps make that possible. According to
one scholar, the homogeneous (voting) populations of New England and
the South each quickly reached agreement respecting the strategy to be
adopted in opposing the policies Britain pursued after the Seven Years'
War. The militants at the Continental Congress thus came overwhelm-
ingly from those two sections." Nonetheless, notwithstanding the remark-
able diversity of New York City's population, its residents responded like
other eighteenth-century Americans by earnestly and repeatedly seeking
to create a consensus over how best to resist British imperialism. If Kries-
berg's findings can serve as a guide, the nature of that effort at consensus
Introduction [9]
building markedly influenced the pace and direction of revolutionary ac-
tivity in the province. Given the sharp differences of opinion and interest
so characteristic of New York, it understandably took the city's leaders
considerable time to hammer out a course of action acceptable to most
people. And the course that finally emerged had to be cautious rather
than militant, conservative rather than radical, and inclusive rather than
exclusive, in order that as many people as possible might be united be-
hind the revolutionary banner. In the end, the vast majority of New York-
ers espoused independence, though most did so very hesitantly.
Third, although conflict is a normal and necessary part of human exis-
tence, under some circumstances a series of conflicts between two antago-
nists can "spiral" out of control and end in a manner that neither party
had intended at the outset." That is exactly what happened in Anglo-
American relations between 176g and 1776. It is also where the works of
Skocpol and Kriesberg most effectively buttress one another. The first
explains why conflict kept recurring, and the second clarifies why people
behaved the way they did in the heat of conflict and how the outcome of
one dispute influenced the dynamics of the next..
In sum, by applying the theoretical constructs of Skocpol and Kries-
berg, by focusing on the role that British imperialism played in provoking
the Revolution, by examining how pluralism shaped the way townspeople
responded to the three crises, and by observing residents as they labored
to form and to maintain a consensus during very challenging times, this
study will endeavor to explain why New Yorkers were such reluctant revo-
lutionaries. In the final analysis, residents behaved the way they did not
because most were loyalists (most were not), not because a handful of
patrician conservatives was able singlehandedly to dampen the passion
for revolution, but because the heterogeneity of the city's population
made it very difficult for residents to reach a broad consensus over how
to resist British imperialism. The really significant fact is not that they
moved so slowly but that in the end they painstakingly constructed a con-
sensus, declared their independence, and became a pivotal state in the
new nation."""

def populate_week3_reading():
    """Find Week 3 assignment and populate it with reading text"""
    db = SessionLocal()

    try:
        # Find Week 3 assignment
        assignment = db.query(Assignment).filter(Assignment.week_number == 3).first()

        if assignment:
            assignment.reading_text = WEEK3_READING_TEXT
            db.commit()
            print(f"Successfully updated assignment '{assignment.title}' (Week {assignment.week_number}) with reading text")
            print(f"Text length: {len(WEEK3_READING_TEXT)} characters")
        else:
            print("Week 3 assignment not found in database")

            # List all assignments to help debug
            all_assignments = db.query(Assignment).all()
            print("\nAvailable assignments:")
            for a in all_assignments:
                print(f"  - ID: {a.id}, Title: '{a.title}', Week: {a.week_number}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_week3_reading()